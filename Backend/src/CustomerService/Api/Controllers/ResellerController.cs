    using Application.DTOs;
    using Application.Features.Resellers.Commands.CreateReseller;
    using Application.Features.Resellers.Commands.GetAllResellers;
    using Application.Features.Resellers.Commands.UpdateReseller;
    using Application.Features.Resellers.Commands.GetResellerById;
    using Application.Features.Resellers.Commands.DeleteReseller;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    namespace Api.Controllers
    {
        [ApiController]
        [Route("api/resellers")]
        [Authorize]
        public class ResellerController : ControllerBase
        {
            private readonly CreateResellerHandler _createResellerHandler;
            private readonly GetAllResellerHandler _getAllResellerHandler;
            private readonly UpdateResellerHandler _updateResellerHandler;
            private readonly GetResellerByIdHandler _getResellerByIdHandler;
            private readonly DeleteResellerHandler _deleteResellerHandler;

            public ResellerController(
                CreateResellerHandler createResellerHandler,
                UpdateResellerHandler updateResellerHandler,
                GetAllResellerHandler getAllResellerHandler,
                GetResellerByIdHandler getResellerByIdHandler,
                DeleteResellerHandler deleteResellerHandler)
            {
                _createResellerHandler = createResellerHandler;
                _updateResellerHandler = updateResellerHandler;
                _getAllResellerHandler = getAllResellerHandler;
                _getResellerByIdHandler = getResellerByIdHandler;
                _deleteResellerHandler = deleteResellerHandler;
            }
            
            [HttpPost]
            [Authorize]
            public async Task<ActionResult<int>> Create(CreateReseller command)
            {
                var id = await _createResellerHandler.Handle(command);
                return Ok(id);
            }
            [HttpPut("{id}")]
            [Authorize]
            public async Task<IActionResult> Update(int id, UpdateReseller command)
            {
                command.Id = id;
                await _updateResellerHandler.Handle(command);
                return NoContent();
            }
            [HttpGet("{id}")]
            [Authorize]
            public async Task<IActionResult> GetById(int id)
            {
                var result = await _getResellerByIdHandler.Handle(new GetResellerById { Id = id });

                if (result == null)
                    return NotFound("Reseller not found");

                return Ok(result);
            }

            [HttpDelete("{id}")]
            [Authorize]
            public async Task<IActionResult> Delete(int id)
            {
                await _deleteResellerHandler.Handle(new DeleteReseller { Id = id });
                return NoContent();
            }

            [HttpGet]
            [Authorize]
            public async Task<ActionResult<PagedResult<ResellerDto>>> GetAll(
                [FromQuery] GetAllResellers query)
            {
                var result = await _getAllResellerHandler.Handle(query);
                return Ok(result);
            }
        }
    }