namespace Shared.Events;

public class InvoiceReminderEvent
{
    public string ContractNumber { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public decimal Amount { get; set; } // Giả sử có số tiền
    public DateTime DueDate { get; set; }
}