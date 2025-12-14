using FluentValidation;

namespace Application.Features.Addresses.Commands.GetAllAddresses
{
    public class GetAllAddressesValidator : AbstractValidator<GetAllAddresses>
    {
        public GetAllAddressesValidator()
        {
            RuleFor(x => x.PageNumber)
                .GreaterThan(0)
                .WithMessage("PageNumber must be greater than 0.");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("PageSize must be between 1 and 100.");
        }
    }
}