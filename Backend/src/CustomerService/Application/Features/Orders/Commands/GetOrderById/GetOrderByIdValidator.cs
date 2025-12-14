using FluentValidation;

namespace Application.Features.Orders.Commands.GetOrderById
{
    public class GetOrderByIdValidator : AbstractValidator<GetOrderById>
    {
        public GetOrderByIdValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
        }
    }
}