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
        var today = DateTime.UtcNow.Date;
        
        // Logic: Nhắc trước 1 ngày so với EndDate
        // Ví dụ: Hôm nay 10/12 -> Cần nhắc những thằng hết hạn ngày 11/12
        var targetDate = today.AddDays(1);

        _logger.LogInformation($"--- BẮT ĐẦU QUÉT HÓA ĐƠN HẾT HẠN NGÀY {targetDate:dd/MM/yyyy} ---");

        // Lấy các Order sắp hết hạn vào ngày mai VÀ chưa gửi thông báo
        var dueOrders = await _context.InvoiceOrders
            .Where(x => x.EndDate.Date == targetDate 
                        && x.Status == "Unpaid" // Chỉ nhắc những đơn chưa trả
                        && !x.IsReminderSent)   // Tránh gửi lại nhiều lần
            .ToListAsync();

        foreach (var order in dueOrders)
        {
            try 
            {
                // 1. Bắn sự kiện gửi mail
                await _publishEndpoint.Publish(new InvoiceReminderEvent
                {
                    ContractNumber = order.ContractNumber,
                    Email = order.Email,
                    FullName = order.FullName,
                    DueDate = order.EndDate, // Hạn chót là ngày mai
                    Amount = order.Amount,
                    Description = $"Nhắc nhở thanh toán cho đơn hàng #{order.OriginalOrderId}"
                });

                // 2. Đánh dấu đã gửi để không gửi lại nếu job chạy lại
                order.IsReminderSent = true;
                _logger.LogInformation($"Đã gửi nhắc nhở cho Order #{order.OriginalOrderId} - {order.Email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi gửi mail cho Order #{order.OriginalOrderId}");
            }
        }

        // Lưu trạng thái IsReminderSent vào DB
        if (dueOrders.Any())
        {
            await _context.SaveChangesAsync();
        }
        
        _logger.LogInformation($"--- KẾT THÚC. ĐÃ GỬI: {dueOrders.Count} EMAIL ---");
    }
}