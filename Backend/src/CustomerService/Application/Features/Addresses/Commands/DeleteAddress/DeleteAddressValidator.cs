using FluentValidation;

namespace Application.Features.Addresses.Commands.DeleteAddress
{
    public class DeleteAddressValidator : AbstractValidator<DeleteAddress>
    {
        public DeleteAddressValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0)
                .WithMessage("Id must be greater than 0.");
        }
    }
}