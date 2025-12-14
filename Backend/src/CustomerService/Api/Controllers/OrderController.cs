using Application.DTOs;
using Application.Features.Orders.Commands.CreateOrder;
using Application.Features.Orders.Commands.GetAllOrders;
using Application.Features.Orders.Commands.GetOrderById;
using Application.Features.Orders.Commands.UpdateOrder;
using Application.Features.Orders.Commands.DeleteOrder;
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

        public OrderController(
            CreateOrderHandler createHandler,
            GetAllOrdersHandler getAllHandler,
            GetOrderByIdHandler getByIdHandler,
            UpdateOrderHandler updateHandler,
            DeleteOrderHandler deleteHandler)
        {
            _createHandler = createHandler;
            _getAllHandler = getAllHandler;
            _getByIdHandler = getByIdHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
        }

        [HttpPost]
        [Authorize]
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
        [Authorize]
        public async Task<ActionResult<OrderDto>> GetById(int id)
        {
            var res = await _getByIdHandler.Handle(new GetOrderById { Id = id });
            if (res == null) return NotFound();
            return Ok(res);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, UpdateOrder req)
        {
            req.Id = id;
            await _updateHandler.Handle(req);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            await _deleteHandler.Handle(new DeleteOrder { Id = id });
            return NoContent();
        }
    }
}
