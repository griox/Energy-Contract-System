using FluentValidation;

namespace Application.Features.Orders.Commands.DeleteOrder
{
    public class DeleteOrderValidator : AbstractValidator<DeleteOrder>
    {
        public DeleteOrderValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
        }
    }
}