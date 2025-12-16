namespace Shared.Events;

public class InvoiceReminderEvent
{
    public string ContractNumber { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    
    // 👇 THÊM TRƯỜNG NÀY (để hiển thị nội dung: "Thanh toán cho đơn hàng #123")
    public string Description { get; set; } 
}