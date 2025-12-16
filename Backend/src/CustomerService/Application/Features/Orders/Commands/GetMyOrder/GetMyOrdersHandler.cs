using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Orders.Commands.GetMyOrder;

public class GetMyOrdersHandler
{
    private readonly IOrderRepository _orderRepository; // Nhớ inject vào Constructor

    public GetMyOrdersHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<List<OrderDto>> Handle(string email)
    {
        var orders = await _orderRepository.GetOrdersByUserEmailAsync(email);

        // Map từ Entity sang DTO
        return orders.Select(o => new OrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            OrderType = o.OrderType,
            Status = o.Status,
            StartDate = o.StartDate,
            EndDate = o.EndDate,
            TopupFee = o.TopupFee,
            ContractId = o.ContractId,
            ContractNumber = o.Contract?.ContractNumber 
        }).ToList();
    }
}