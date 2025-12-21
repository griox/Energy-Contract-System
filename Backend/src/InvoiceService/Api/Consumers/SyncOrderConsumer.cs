using Api.Data;
using MassTransit;
using Shared.Events; // Giả sử chứa OrderCreatedEvent
using Api.Models;
using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Consumers;
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

        // 1. KIỂM TRA TRÙNG LẶP (QUAN TRỌNG)
        // Nếu đã có hóa đơn cho Order này rồi thì bỏ qua
        var exists = await _context.InvoiceOrders
            .AnyAsync(x => x.OriginalOrderId == msg.Id);

        if (exists)
        {
            _logger.LogWarning($"Order {msg.Id} đã tồn tại trong InvoiceService. Bỏ qua.");
            return;
        }

        // 2. Tạo mới
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
        
        _logger.LogInformation($"Đã đồng bộ Order {msg.Id} thành công.");
    }
}