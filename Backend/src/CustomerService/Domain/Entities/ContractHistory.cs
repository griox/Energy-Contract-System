using Domain.Common;

namespace Domain.Entities;

public class ContractHistory : BaseEntity
{
    // Lưu dữ liệu dưới dạng chuỗi JSON
    public string OldValue { get; set; } = "{}"; 
    public string NewValue { get; set; } = "{}";
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Khóa ngoại tới Contract
    public int ContractId { get; set; }
    public Contract Contract { get; set; } = null!;
}