namespace Application.Features.Contracts.Commands.UpdateContract
{
    public class UpdateContract
    {
        public int Id { get; set; } // Bắt buộc để biết sửa ai
    
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? CompanyName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? PdfLink { get; set; }
        public int ResellerId { get; set; }
        public int AddressId { get; set; }
    }
}
