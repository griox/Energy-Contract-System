namespace Application.Features.ContractHistories.Commands.GetHistoryByContractId
{
    public class GetHistoryByContractId
    {
        public int ContractId { get; set; }

        public string? Search { get; set; }

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}