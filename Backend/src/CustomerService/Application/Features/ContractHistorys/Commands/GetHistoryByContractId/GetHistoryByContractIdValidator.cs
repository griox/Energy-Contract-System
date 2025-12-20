using FluentValidation;

namespace Application.Features.ContractHistorys.Commands.GetHistoryByContractId
{
    public class GetHistoryByContractIdValidator : AbstractValidator<ContractHistorys.Commands.GetHistoryByContractId.GetHistoryByContractId>
    {
        public GetHistoryByContractIdValidator()
        {
            RuleFor(x => x.ContractId)
                .GreaterThan(0)
                .WithMessage("ContractId must be greater than 0.");
        }
    }
}