using FluentValidation;

namespace Application.Features.Addresses.Commands.CreateAddress;

public class CreateAddressValidator : AbstractValidator<CreateAddress>
{
    public CreateAddressValidator()
    {
        RuleFor(p => p.Extension)
            .NotEmpty().WithMessage("{PropertyName} is required.")
            .NotNull();
        
        RuleFor(p => p.ZipCode)
            .NotEmpty().WithMessage("{PropertyName} is required.")
            .NotNull();

        RuleFor(p => p.HouseNumber)
            .NotEmpty().WithMessage("{PropertyName} is required.")
            .NotNull();
    }
}