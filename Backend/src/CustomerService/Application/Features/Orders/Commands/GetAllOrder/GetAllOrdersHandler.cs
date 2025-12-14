using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Orders.Commands.GetAllOrders
{
    public class GetAllOrdersHandler
    {
        private readonly IOrderRepository _orderRepository;

        public GetAllOrdersHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<PagedResult<OrderDto>> Handle(GetAllOrders request)
        {
            var (orders, totalCount) = await _orderRepository.GetPagedAsync(
                request.Search,
                request.Status,
                request.OrderType,
                request.PageNumber,
                request.PageSize,
                request.SortBy,
                request.SortDesc);

            var items = orders.Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                OrderType = o.OrderType,
                Status = o.Status,
                StartDate = o.StartDate,
                EndDate = o.EndDate,
                TopupFee = o.TopupFee,
                ContractId = o.ContractId
            }).ToList();

            return new PagedResult<OrderDto>
            {
                Items = items,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };
        }
    }
}