using Api.Common.Messaging.Contracts;
using Api.Infrastructures.Persistence;
using Api.Models;
using MassTransit;

public class ContractChangedConsumer : IConsumer<ContractChangedEvent>
{
    private readonly ContractHistoryDbContext _db;

    public ContractChangedConsumer(ContractHistoryDbContext db) => _db = db;

    public async Task Consume(ConsumeContext<ContractChangedEvent> context)
    {
        var msg = context.Message;

        _db.ContractHistories.Add(new ContractHistory
        {
            ContractId = msg.ContractId,
            OldValue = msg.OldValue,
            NewValue = msg.NewValue,
            Timestamp = msg.Timestamp
        });

        await _db.SaveChangesAsync();
    }
}