using Application.DTOs;

namespace Application.Features.Contracts.Commands.GetContractsByChoice
{
    // Dùng cho GET /api/contracts
    public class GetContractsByChoice
    {
        // Search chung: ContractNumber, CustomerName, Email, Phone
        public string? Search { get; set; }

        // Filter
        public int? ResellerId { get; set; }
        public DateTime? StartDateFrom { get; set; }
        public DateTime? StartDateTo { get; set; }

        // Pagination
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        // Sort
        public string? SortBy { get; set; } 
        public bool SortDesc { get; set; } = true;
    }
}