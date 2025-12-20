using Application.DTOs;
using Application.Features.ContractHistories.Commands.CreateContractHistory;
using Application.Features.ContractHistorys.Commands.GetHistoryByContractId;
using Application.Features.ContractHistorys.Commands.GetAllContractHistories;
using Application.Features.ContractHistories.Commands.DeleteContractHistory;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/contract-histories")]
    public class ContractHistoryController : ControllerBase
    {
        private readonly CreateContractHistoryHandler _createHandler;
        private readonly GetHistoryByContractIdHandler _getHandler;
        
        // --- THÊM 2 HANDLER MỚI ---
        private readonly GetAllContractHistoriesHandler _getAllHandler;
        private readonly DeleteContractHistoryHandler _deleteHandler;

        public ContractHistoryController(
            CreateContractHistoryHandler createHandler,
            GetHistoryByContractIdHandler getHandler,
            // Inject vào constructor
            GetAllContractHistoriesHandler getAllHandler,
            DeleteContractHistoryHandler deleteHandler)
        {
            _createHandler = createHandler;
            _getHandler = getHandler;
            _getAllHandler = getAllHandler;
            _deleteHandler = deleteHandler;
        }

        [HttpPost]
        public async Task<ActionResult<int>> Create(CreateContractHistory request)
        {
            var id = await _createHandler.Handle(request);
            return Ok(id);
        }

        [HttpGet("contract/{contractId}")]
        public async Task<ActionResult<PagedResult<ContractHistoryDto>>> GetByContractId(
            int contractId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            var result = await _getHandler.Handle(new GetHistoryByContractId
            {
                ContractId = contractId,
                PageNumber = pageNumber,
                PageSize = pageSize,
                Search = search
            });

            return Ok(result);
        }

        // --- API 1: LẤY TẤT CẢ ---
        [HttpGet]
        public async Task<ActionResult<PagedResult<ContractHistoryDto>>> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            var request = new GetAllContractHistories
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                Search = search
            };

            var result = await _getAllHandler.Handle(request);
            return Ok(result);
        }

        // --- API 2: XÓA ---
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var request = new DeleteContractHistory { Id = id };
            var success = await _deleteHandler.Handle(request);

            if (!success)
            {
                return NotFound(new { Message = $"History with id {id} not found" });
            }

            return Ok(new { Message = "Deleted successfully" });
        }
    }
}