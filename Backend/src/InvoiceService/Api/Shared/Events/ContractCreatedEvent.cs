namespace Shared.Events;

public class ContractCreatedEvent
{
    public string ContractNumber { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime FinishedAt { get; set; }
}