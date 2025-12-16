using Api.Data;
using MassTransit;
using Shared.Events; // Giả sử chứa OrderCreatedEvent
using Api.Models;
using Api.Data;

namespace Api.Consumers;

// Event này phải được định nghĩa trong Shared.Events
// public class OrderCreatedEvent { 
//     public int Id { get; set; }
//     public string ContractNumber { get; set; }
//     public string Email { get; set; } // Order Service phải Join Contract để lấy cái này gửi sang
//     public string FullName { get; set; }
//     public DateTime StartDate { get; set; }
//     public DateTime EndDate { get; set; }
//     public decimal TopupFee { get; set; }
// }

public class SyncOrderConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly InvoiceDbContext _context;
    private readonly ILogger<SyncOrderConsumer> _logger;

    public SyncOrderConsumer(InvoiceDbContext context, ILogger<SyncOrderConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation($"Đồng bộ Order {msg.Id} cho User {msg.Email}");

        var invoiceOrder = new InvoiceOrder
        {
            OriginalOrderId = msg.Id,
            ContractNumber = msg.ContractNumber,
            Email = msg.Email,
            FullName = msg.FullName,
            StartDate = msg.StartDate,
            EndDate = msg.EndDate,
            Amount = msg.TopupFee,
            Status = "Unpaid",
            IsReminderSent = false
        };

        _context.InvoiceOrders.Add(invoiceOrder);
        await _context.SaveChangesAsync();
    }
}