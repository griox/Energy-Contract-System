using FluentValidation;

namespace Application.Features.Resellers.Commands.GetResellerById
{
    public class GetResellerByIdValidator : AbstractValidator<GetResellerById>
    {
        public GetResellerByIdValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
        }
    }
}