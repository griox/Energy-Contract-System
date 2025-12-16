namespace Shared.Events;

public class OrderCreatedEvent
{
    public int Id { get; set; } // OrderId gốc
    public string ContractNumber { get; set; }
    public string Email { get; set; }    // Quan trọng để InvoiceService biết gửi cho ai
    public string FullName { get; set; } // Quan trọng để hiển thị tên
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TopupFee { get; set; }
}