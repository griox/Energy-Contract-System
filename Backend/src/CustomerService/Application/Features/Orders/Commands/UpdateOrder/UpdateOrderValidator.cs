using FluentValidation;

namespace Application.Features.Orders.Commands.UpdateOrder
{
    public class UpdateOrderValidator : AbstractValidator<UpdateOrder>
    {
        public UpdateOrderValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.OrderNumber).NotEmpty();
            RuleFor(x => x.OrderType).GreaterThanOrEqualTo(0);
            RuleFor(x => x.Status).GreaterThanOrEqualTo(0);

            RuleFor(x => x.StartDate).NotEmpty();
            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate)
                .WithMessage("End date must be after start date.");

            RuleFor(x => x.TopupFee).GreaterThanOrEqualTo(0);
        }
    }
}