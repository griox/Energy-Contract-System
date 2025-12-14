using FluentValidation;

namespace Application.Features.Addresses.Commands.GetAddress
{
    public class GetAddressByIdValidator : AbstractValidator<GetAddressById>
    {
        public GetAddressByIdValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0)
                .WithMessage("Address Id must be greater than 0.");
        }
    }
}