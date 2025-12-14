using FluentValidation;

namespace Application.Features.ContractHistories.Commands.CreateContractHistory
{
    public class CreateContractHistoryValidator : AbstractValidator<CreateContractHistory>
    {
        public CreateContractHistoryValidator()
        {
            RuleFor(x => x.ContractId)
                .GreaterThan(0)
                .WithMessage("ContractId must be greater than 0.");

            RuleFor(x => x.OldValue)
                .NotNull()
                .WithMessage("OldValue is required.");

            RuleFor(x => x.NewValue)
                .NotNull()
                .WithMessage("NewValue is required.");
        }
    }
}