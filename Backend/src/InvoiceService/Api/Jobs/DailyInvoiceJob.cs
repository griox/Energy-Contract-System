using Api.Data;
using Quartz;
using MassTransit;
using Shared.Events;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;

namespace Api.Jobs;

[DisallowConcurrentExecution]
public class DailyInvoiceJob : IJob
{
    private readonly InvoiceDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<DailyInvoiceJob> _logger;

    public DailyInvoiceJob(InvoiceDbContext context, IPublishEndpoint publishEndpoint, ILogger<DailyInvoiceJob> logger)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
{
    // Lưu ý: Đảm bảo EndDate trong DB cũng lưu dạng UTC
    var today = DateTime.UtcNow.Date;
    var targetDate = today.AddDays(1);

    _logger.LogInformation($"--- BẮT ĐẦU QUÉT HÓA ĐƠN HẾT HẠN NGÀY {targetDate:dd/MM/yyyy} ---");

    // Lấy tối đa 100 đơn mỗi lần quét để tránh tràn RAM nếu dữ liệu quá lớn
    var dueOrders = await _context.InvoiceOrders
        .Where(x => x.EndDate.Date == targetDate 
                    && x.Status == "Unpaid"
                    && !x.IsReminderSent)
        .Take(100) // Batch size an toàn
        .ToListAsync();

    if (!dueOrders.Any())
    {
        _logger.LogInformation("Không có đơn hàng nào cần nhắc nhở hôm nay.");
        return;
    }

    foreach (var order in dueOrders)
    {
        using var transaction = _context.Database.BeginTransaction(); // Tùy chọn: Dùng transaction cho chắc ăn
        try 
        {
            // 1. Gửi Event
            await _publishEndpoint.Publish(new InvoiceReminderEvent
            {
                ContractNumber = order.ContractNumber,
                Email = order.Email,
                FullName = order.FullName,
                DueDate = order.EndDate,
                Amount = order.Amount,
                Description = $"Nhắc nhở thanh toán cho đơn hàng #{order.OriginalOrderId}"
            });

            // 2. Cập nhật trạng thái NGAY LẬP TỨC
            order.IsReminderSent = true;
            
            // Save ngay từng dòng để đảm bảo nếu crash giữa chừng thì những dòng đã gửi ko bị rollback
            await _context.SaveChangesAsync(); 
            
            // Commit transaction (nếu dùng)
            // await transaction.CommitAsync();

            _logger.LogInformation($"Đã gửi nhắc nhở cho Order #{order.OriginalOrderId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Lỗi xử lý Order #{order.OriginalOrderId}");
            // Không throw exception để vòng lặp tiếp tục chạy cho các đơn khác
        }
    }
    
    _logger.LogInformation($"--- KẾT THÚC JOB ---");
}
}