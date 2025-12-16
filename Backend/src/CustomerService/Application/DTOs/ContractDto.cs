namespace Application.DTOs;

public class ContractDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string CustomerName => $"{FirstName} {LastName}";
    public string Email { get; set; }
    public string Phone { get; set; }
    public string? CompanyName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? PdfLink { get; set; }
    public int? AddressId { get; set; }
    public string? AddressZipCode { get; set; }
    public string? AddressHouseNumber { get; set; }
    public int? ResellerId { get; set; }
    public string? ResellerName { get; set; }
    public string? ResellerType { get; set; }
    public ICollection<OrderDto> Orders { get; set; }
}