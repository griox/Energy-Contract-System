namespace Api.VMs;

public class ContractPdfRequest
{
    public int ContractId { get; set; } // Thêm ID nếu cần update theo ID
    public string ContractNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string AddressLine { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "VND";
    public string? TemplateName { get; set; } 
    // Link PDF hiện tại (nếu có) để xóa
    public string? CurrentPdfUrl { get; set; } 
}