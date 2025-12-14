using FluentValidation;

namespace Application.Features.Orders.Commands.CreateOrder
{
    public class CreateOrderValidator : AbstractValidator<CreateOrder>
    {
        public CreateOrderValidator()
        {
            RuleFor(x => x.OrderNumber).NotEmpty();
            RuleFor(x => x.OrderType).GreaterThanOrEqualTo(0);
            RuleFor(x => x.Status).GreaterThanOrEqualTo(0);
            RuleFor(x => x.StartDate).NotEmpty();
            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate)
                .WithMessage("EndDate must be after StartDate.");
            RuleFor(x => x.TopupFee).GreaterThanOrEqualTo(0);
            RuleFor(x => x.ContractId).GreaterThan(0);
        }
    }
}