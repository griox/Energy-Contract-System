using FluentValidation;

namespace Application.Features.ContractHistories.Commands.GetHistoryByContractId
{
    public class GetHistoryByContractIdValidator : AbstractValidator<GetHistoryByContractId>
    {
        public GetHistoryByContractIdValidator()
        {
            RuleFor(x => x.ContractId)
                .GreaterThan(0)
                .WithMessage("ContractId must be greater than 0.");
        }
    }
}