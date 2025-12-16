using System.Security.Claims;
using Application.DTOs;
using Application.Features.Orders.Commands.CreateOrder;
using Application.Features.Orders.Commands.GetAllOrders;
using Application.Features.Orders.Commands.GetOrderById;
using Application.Features.Orders.Commands.UpdateOrder;
using Application.Features.Orders.Commands.DeleteOrder;
using Application.Features.Orders.Commands.GetMyOrder;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly CreateOrderHandler _createHandler;
        private readonly GetAllOrdersHandler _getAllHandler;
        private readonly GetOrderByIdHandler _getByIdHandler;
        private readonly UpdateOrderHandler _updateHandler;
        private readonly DeleteOrderHandler _deleteHandler;
        private readonly GetMyOrdersHandler _getMyOrdersHandler;

        public OrderController(
            CreateOrderHandler createHandler,
            GetAllOrdersHandler getAllHandler,
            GetOrderByIdHandler getByIdHandler,
            UpdateOrderHandler updateHandler,
            GetMyOrdersHandler getMyOrdersHandler,
            DeleteOrderHandler deleteHandler)
        {
            _createHandler = createHandler;
            _getAllHandler = getAllHandler;
            _getByIdHandler = getByIdHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
            _getMyOrdersHandler = getMyOrdersHandler;
        }

        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<int>> Create(CreateOrder req)
        {
            var id = await _createHandler.Handle(req);
            return Ok(id);
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<PagedResult<OrderDto>>> GetAll(
            [FromQuery] GetAllOrders query)
        {
            var result = await _getAllHandler.Handle(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<OrderDto>> GetById(int id)
        {
            var res = await _getByIdHandler.Handle(new GetOrderById { Id = id });
            if (res == null) return NotFound();
            return Ok(res);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> Update(int id, UpdateOrder req)
        {
            req.Id = id;
            await _updateHandler.Handle(req);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles="User")]
        public async Task<IActionResult> Delete(int id)
        {
            await _deleteHandler.Handle(new DeleteOrder { Id = id });
            return NoContent();
        }
        [HttpGet("me")]
        [Authorize]// API: /api/orders/me
        public async Task<ActionResult<List<OrderDto>>> GetMyOrders()
        {
            // 1. Lấy Email từ Token
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized("Không tìm thấy Email trong Token");
            }

            // 2. Gọi Handler
            var result = await _getMyOrdersHandler.Handle(email);
            return Ok(result);
        }
    }
}
