using FluentValidation;

namespace Application.Features.Resellers.Commands.DeleteReseller
{
    public class DeleteResellerValidator : AbstractValidator<DeleteReseller>
    {
        public DeleteResellerValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
        }
    }
}