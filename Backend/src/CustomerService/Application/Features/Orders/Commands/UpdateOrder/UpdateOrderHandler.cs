using Application.Interfaces;

namespace Application.Features.Orders.Commands.UpdateOrder
{
    public class UpdateOrderHandler
    {
        private readonly IOrderRepository _orderRepository;

        public UpdateOrderHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task Handle(UpdateOrder request)
        {
            var o = await _orderRepository.GetByIdAsync(request.Id);

            if (o == null)
                throw new Exception("Order not found");

            o.OrderNumber = request.OrderNumber;
            o.OrderType = request.OrderType;
            o.Status = request.Status;
            o.StartDate = request.StartDate;
            o.EndDate = request.EndDate;
            o.TopupFee = request.TopupFee;

            await _orderRepository.UpdateAsync(o);
        }
    }
}