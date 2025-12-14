using Application.Features.Resellers.Commands.CreateReseller;
using FluentValidation;

namespace Application.Features.Resellers.Commands.CreateReseller;

public class CreateResellerValidator: AbstractValidator<CreateReseller>
{
   public CreateResellerValidator()
   {
      RuleFor(p => p.Name)
         .NotEmpty().WithMessage("{PropertyName} is required.")
         .NotNull()
         .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.");

      RuleFor(p => p.Type)
         .NotEmpty().WithMessage("{PropertyName} is required.")
         .NotNull();
   }
}