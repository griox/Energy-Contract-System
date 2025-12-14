using FluentValidation;

namespace Application.Features.Resellers.Commands.UpdateReseller
{
    public class UpdateResellerValidator : AbstractValidator<UpdateReseller>
    {
        public UpdateResellerValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Type).NotEmpty().MaximumLength(50);
        }
    }
}