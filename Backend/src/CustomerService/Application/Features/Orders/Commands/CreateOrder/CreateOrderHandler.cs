using Application.Interfaces;
using Domain.Entities;
using MassTransit;                  // 1. Dùng cho RabbitMQ
using Shared.Events;                // 2. Dùng cho Event
using Microsoft.AspNetCore.Http;    // 3. Dùng để đọc Token
using System.Security.Claims;       // 4. Dùng để đọc Claims
using Domain.Enums;
namespace Application.Features.Orders.Commands.CreateOrder
{
    public class CreateOrderHandler
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IPublishEndpoint _publishEndpoint;       // Inject MassTransit
        private readonly IHttpContextAccessor _httpContextAccessor; // Inject Token Reader
        private readonly IContractRepository _contractRepository;   // Inject để lấy số hợp đồng

        public CreateOrderHandler(
            IOrderRepository orderRepository,
            IPublishEndpoint publishEndpoint,
            IHttpContextAccessor httpContextAccessor,
            IContractRepository contractRepository)
        {
            _orderRepository = orderRepository;
            _publishEndpoint = publishEndpoint;
            _httpContextAccessor = httpContextAccessor;
            _contractRepository = contractRepository;
        }

        public async Task<int> Handle(CreateOrder request)
        {
            // 1. Logic lưu Order vào Database (Giữ nguyên)
            var order = new Order
            {
              
                OrderType = request.OrderType,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TopupFee = request.TopupFee,
                ContractId = request.ContractId
            };
            order.OrderNumber = Guid.NewGuid().ToString("N")[..8].ToUpper();

            await _orderRepository.AddAsync(order);
            
            var user = _httpContextAccessor.HttpContext?.User;
            var email = user?.FindFirst(ClaimTypes.Email)?.Value; 
            var fullName = user?.FindFirst(ClaimTypes.Name)?.Value; 
            var contract = await _contractRepository.GetContractById(request.ContractId);
            var contractNumber = contract?.ContractNumber ?? "UNKNOWN"; 

            // C. Bắn tin nhắn (Publish Event)
            if (!string.IsNullOrEmpty(email)) // Chỉ bắn nếu lấy được email
            {
                await _publishEndpoint.Publish(new OrderCreatedEvent
                {
                    Id = order.Id,
                    ContractNumber = contractNumber,
                    Email = email,          // ✅ Lấy từ Token
                    FullName = fullName,    // ✅ Lấy từ Token
                    StartDate = order.StartDate,
                    EndDate = order.EndDate,
                    TopupFee = order.TopupFee
                });
            }

            return order.Id;
        }
    }
}