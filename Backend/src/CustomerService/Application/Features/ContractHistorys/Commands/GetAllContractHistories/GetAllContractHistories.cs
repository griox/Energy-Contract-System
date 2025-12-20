using Application.DTOs; // Namespace chứa PagedResult

namespace Application.Features.ContractHistories.Commands.GetAllContractHistories
{
    public class GetAllContractHistories
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Search { get; set; }
    }
}