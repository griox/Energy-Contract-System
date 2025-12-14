using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Orders.Commands.GetOrderById
{
    public class GetOrderByIdHandler
    {
        private readonly IOrderRepository _orderRepository;

        public GetOrderByIdHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<OrderDto?> Handle(GetOrderById request)
        {
            var o = await _orderRepository.GetByIdAsync(request.Id);
            if (o == null) return null;

            return new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                OrderType = o.OrderType,
                Status = o.Status,
                StartDate = o.StartDate,
                EndDate = o.EndDate,
                TopupFee = o.TopupFee,
                ContractId = o.ContractId
            };
        }
    }
}