namespace Application.Features.ContractHistories.Commands.CreateContractHistory
{
    public class CreateContractHistory
    {
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public int ContractId { get; set; }
    }
}