namespace Api.Models;

public class ContractHistory
{
    public long Id { get; set; }

    public int ContractId { get; set; }

    // JSON snapshot
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}