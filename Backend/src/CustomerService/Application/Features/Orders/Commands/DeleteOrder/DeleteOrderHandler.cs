using Application.Interfaces;

namespace Application.Features.Orders.Commands.DeleteOrder
{
    public class DeleteOrderHandler
    {
        private readonly IOrderRepository _orderRepository;

        public DeleteOrderHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task Handle(DeleteOrder request)
        {
            var o = await _orderRepository.GetByIdAsync(request.Id);

            if (o == null)
                throw new Exception("Order not found");

            await _orderRepository.DeleteAsync(o);
        }
    }
}