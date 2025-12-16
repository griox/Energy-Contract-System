namespace Api.Models;

public class InvoiceOrder
{
    public int Id { get; set; }
    
    // ID gốc bên Order Service (để đối chiếu nếu cần)
    public int OriginalOrderId { get; set; } 
    public string ContractNumber { get; set; }
    
    // Thông tin người nhận (Lấy từ Contract)
    public string Email { get; set; }
    public string FullName { get; set; }
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; } // Cột mốc quan trọng để quét
    public decimal Amount { get; set; }   // Số tiền cần đóng
    
    public string Status { get; set; } = "Unpaid"; // Unpaid, Paid, Cancelled
    public bool IsReminderSent { get; set; } = false; // Cờ đánh dấu đã gửi mail chưa
}