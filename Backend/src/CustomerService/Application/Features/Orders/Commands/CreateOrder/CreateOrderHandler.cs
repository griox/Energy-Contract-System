using Application.Interfaces;
using Domain.Entities;

namespace Application.Features.Orders.Commands.CreateOrder
{
    public class CreateOrderHandler
    {
        private readonly IOrderRepository _orderRepository;

        public CreateOrderHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<int> Handle(CreateOrder request)
        {
            var order = new Order
            {
                OrderNumber = request.OrderNumber,
                OrderType = request.OrderType,
                Status = request.Status,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TopupFee = request.TopupFee,
                ContractId = request.ContractId
            };

            await _orderRepository.AddAsync(order);
            return order.Id;
        }
    }
}