namespace Api.Common.Messaging.Contracts;

public class ContractChangedEvent
{
    public int ContractId { get; set; }
    public string Action { get; set; } = default!;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? ChangedBy { get; set; }
    public string? CorrelationId { get; set; }
}