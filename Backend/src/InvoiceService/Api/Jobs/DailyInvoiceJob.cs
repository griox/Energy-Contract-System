using Quartz;
using MassTransit;
using Shared.Events;
using Microsoft.EntityFrameworkCore;
using InvoiceService.Api.Infrastructures.Data;
namespace Api.Jobs;

[DisallowConcurrentExecution] // Chặn chạy chồng chéo nếu job cũ chưa xong
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
        var today = DateTime.UtcNow.Date; // Lấy ngày hôm nay
        int currentDay = today.Day;       // Ví dụ: Hôm nay là ngày 10

        _logger.LogInformation($"--- BẮT ĐẦU QUÉT HÓA ĐƠN NGÀY {currentDay} ---");

        // Logic: Lấy các hợp đồng có PaymentDay trùng hôm nay VÀ còn hạn
        var dueContracts = await _context.Subscriptions
            .Where(x => x.IsActive 
                        && x.PaymentDay == currentDay 
                        && x.StartDate <= today 
                        && x.EndDate >= today)
            .ToListAsync();

        foreach (var sub in dueContracts)
        {
            // Bắn tin nhắn sang RabbitMQ để EmailService gửi mail
            await _publishEndpoint.Publish(new InvoiceReminderEvent
            {
                ContractNumber = sub.ContractNumber,
                Email = sub.Email,
                FullName = sub.FullName,
                DueDate = today.AddDays(7), // Hạn đóng là 7 ngày sau
                Amount = 500000 // Giả sử số tiền hoặc lấy từ DB
            });
            
            _logger.LogInformation($"Đã tạo hóa đơn cho: {sub.Email}");
        }
        
        _logger.LogInformation($"--- KẾT THÚC QUÉT. TỔNG: {dueContracts.Count} ---");
    }
}