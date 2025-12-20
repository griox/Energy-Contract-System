using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Orders.Commands.GetAllOrders
{
    // 👇 Bỏ kế thừa IRequestHandler
    public class GetAllOrdersHandler
    {
        private readonly IOrderRepository _orderRepository;

        public GetAllOrdersHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        // 👇 Method Handle bình thường, nhận class GetAllOrders
        public async Task<PagedResult<OrderDto>> Handle(GetAllOrders request)
        {
            // Gọi Repository (đủ 8 tham số)
            var (orders, totalCount) = await _orderRepository.GetPagedAsync(
                request.Search,
                request.ContractId, // <--- Nhớ truyền cái này
                request.Status,
                request.OrderType,
                request.PageNumber,
                request.PageSize,
                request.SortBy,
                request.SortDesc);

            // Map Entity -> DTO
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

            // Trả về kết quả
            return new PagedResult<OrderDto>
            {
                Items = items,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalCount = totalCount
                // ❌ Đã xóa dòng TotalPages vì bạn bảo class PagedResult không có
            };
        }
    }
}