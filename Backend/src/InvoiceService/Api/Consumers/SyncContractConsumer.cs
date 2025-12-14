using MassTransit;
using Shared.Events;
using Api.Models;
using InvoiceService.Api.Infrastructures.Data;

// DbContext của bạn

public class SyncContractConsumer : IConsumer<ContractCreatedEvent>
{
    private readonly InvoiceDbContext _context;

    public SyncContractConsumer(InvoiceDbContext context)
    {
        _context = context;
    }

    public async Task Consume(ConsumeContext<ContractCreatedEvent> context)
    {
        var msg = context.Message;

        // Lưu bản sao rút gọn vào Invoice DB
        var sub = new ContractSubscription
        {
            ContractNumber = msg.ContractNumber,
            Email = msg.Email,
            FullName = msg.FullName,
            StartDate = msg.CreatedAt, 
            EndDate = msg.FinishedAt, 
            PaymentDay = msg.CreatedAt.Day, 
            IsActive = true
        };

        _context.Subscriptions.Add(sub);
        await _context.SaveChangesAsync();
    }
}