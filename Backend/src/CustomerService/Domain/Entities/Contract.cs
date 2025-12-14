using Domain.Common;

namespace Domain.Entities;

public class Contract : BaseEntity
{
    public string ContractNumber { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // --- Thông tin khách hàng ---
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    
    // --- Thông tin bổ sung ---
    public string? CompanyName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? PdfLink { get; set; } // Link file PDF từ S3 trả về

    // --- Các mối quan hệ (Foreign Keys) ---
    
    // 1. Quan hệ với Reseller (Nhiều Contract thuộc về 1 Reseller)
    public int ResellerId { get; set; }
    public Reseller Reseller { get; set; } = null!;

    // 2. Quan hệ với Address (1 Contract có 1 Address)
    public int AddressId { get; set; }
    public Address Address { get; set; } = null!;

    // 3. Quan hệ với Order (1 Contract có nhiều Order)
    public ICollection<Order> Orders { get; set; } = new List<Order>();

    // 4. Quan hệ với History (1 Contract có nhiều lịch sử thay đổi)
    public ICollection<ContractHistory> History { get; set; } = new List<ContractHistory>();
}