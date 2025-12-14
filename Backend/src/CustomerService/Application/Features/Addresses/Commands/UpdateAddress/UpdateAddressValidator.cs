using FluentValidation;

namespace Application.Features.Addresses.Commands.UpdateAddress;

public class UpdateAddressValidator : AbstractValidator<UpdateAddress>
{
    public UpdateAddressValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.ZipCode)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.HouseNumber)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.Extension)
            .MaximumLength(10);
    }
}