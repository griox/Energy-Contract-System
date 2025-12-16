using System.Security.Claims;
using Application.DTOs;
using Application.Features.Contracts.Commands.CreateContract;
using Application.Features.Contracts.Commands.DeleteContract;
using Application.Features.Contracts.Commands.GetContract;
using Application.Features.Contracts.Commands.GetContractByEmail;
using Application.Features.Contracts.Commands.GetContractsByChoice;
using Application.Features.Contracts.Commands.UpdateContract;
using Application.Features.Contracts.Commands.UpdatePdfUrl; // Import namespace mới
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/contracts")]
[Authorize]
public class ContractController : ControllerBase
{
    private readonly CreateContractHandler _createContractHandler;
    private readonly UpdateContractHandler _updateContractHandler;
    private readonly GetContractByIdHandler _getContractByIdHandler;
    private readonly GetContractsByChoiceHandler _getContractsByChoiceHandler;
    private readonly DeleteContractHandler _deleteContractHandler;
    private readonly UpdatePdfUrlHandler _updatePdfUrlHandler; // Inject thêm handler
    private readonly GetMyContractsHandler _getMyContractsHandler;
    private readonly ILogger<ContractController> _logger;

    public ContractController(
        CreateContractHandler createContractHandler,
        UpdateContractHandler updateContractHandler,
        GetContractByIdHandler getContractByIdHandler,
        GetContractsByChoiceHandler getContractsByChoiceHandler,
        DeleteContractHandler deleteContractHandler,
        UpdatePdfUrlHandler updatePdfUrlHandler, // Inject vào constructor
        ILogger<ContractController> logger,
        GetMyContractsHandler getMyContractsHandler
    )
    {
        _createContractHandler = createContractHandler;
        _updateContractHandler = updateContractHandler;
        _getContractByIdHandler = getContractByIdHandler;
        _getContractsByChoiceHandler = getContractsByChoiceHandler;
        _deleteContractHandler = deleteContractHandler;
        _updatePdfUrlHandler = updatePdfUrlHandler;
        _logger = logger;
        _getContractByIdHandler= getContractByIdHandler;
        _getMyContractsHandler = getMyContractsHandler;
    }   

    // 1. POST: Create new contract
    [HttpPost]
    [Authorize(Roles="Admin")]
    public async Task<ActionResult<int>> Create(CreateContract command)
    {
        try
        {
            var id = await _createContractHandler.Handle(command);
            _logger.LogInformation($"Created contract with id {id}");
            return CreatedAtAction(nameof(GetById), new { id = id }, id);
        }
        catch (Exception ex)
        {
            _logger.LogError("Error creating contract: {Message}", ex.Message);
            return StatusCode(500, ex.Message);
        }
    }

    // 2. PUT: Update contract
    [HttpPut("{id}")]
    [Authorize(Roles="Admin")]
    public async Task<ActionResult> Update(int id, UpdateContract command)
    {
        // [SỬA] Thay vì kiểm tra lỗi, hãy gán luôn ID từ URL vào Command
        // Điều này giúp người dùng không cần quan tâm đến field "id" trong JSON body nữa
        command.Id = id;

       

        try
        {
            await _updateContractHandler.Handle(command);
            _logger.LogInformation($"Updated contract with id {command.Id}");
        }
        catch (Exception ex)
        {
            _logger.LogError("Error updating contract: {Message}", ex.Message);
            return NotFound(ex.Message);
        }

        return NoContent();
    }

    // 3. GET: Get contract details
    [HttpGet("{id}")]
    [Authorize(Roles="Admin,User")]
    public async Task<ActionResult<ContractDto>> GetById(int id)
    {
        var result = await _getContractByIdHandler.Handle(new GetContractById { Id = id });

        if (result == null)
        {
            _logger.LogError("No contract with id {Id}", id);
            return NotFound();
        }
        _logger.LogInformation($"Retrieved contract with id {id}");
        return Ok(result);
    }

    // 4. GET: Get all contracts
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResult<ContractDto>>> GetAll(
        [FromQuery] GetContractsByChoice query)
    {
        try
        {
            if (query.PageNumber <= 0 || query.PageSize <= 0)
            {
                return BadRequest("PageNumber và PageSize phải > 0");
            }

            var result = await _getContractsByChoiceHandler.Handle(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError("Error processing request: {Message}", ex.Message);
            return StatusCode(500, ex.Message);
        }
    }
    // 5. DELETE: Delete contract
    [HttpDelete("{id}")]
    [Authorize(Roles="Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            await _deleteContractHandler.Handle(new DeleteContract { Id = id });
            _logger.LogInformation($"Deleted contract with id {id}");
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError("Error deleting contract: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
    }

    // 6. PUT: Update PDF URL (Internal API called by PdfService)
    [HttpPut("by-number/{contractNumber}/pdf-link")]
    [AllowAnonymous] // Cân nhắc bảo mật: Nên dùng API Key hoặc Internal Network thay vì AllowAnonymous
    public async Task<IActionResult> UpdatePdfUrl(string contractNumber, [FromBody] UpdatePdfUrlCommand command)
    {
        if (contractNumber != command.ContractNumber && !string.IsNullOrEmpty(command.ContractNumber))
        {
            return BadRequest("Contract Number mismatch");
        }

        // Gán lại để chắc chắn đúng
        command.ContractNumber = contractNumber;

        try
        {
            await _updatePdfUrlHandler.Handle(command);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError("Error updating PDF URL: {Message}", ex.Message);
            return NotFound(new { message = ex.Message });
        }
    }
    [HttpGet("me")]
    [Authorize] // Bắt buộc phải có Token
    public async Task<ActionResult<List<ContractDto>>> GetMyContracts()
    {
        try
        {
            
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "Không tìm thấy Email trong Token" });
            }

            // B. Gọi Handler xử lý
            var result = await _getMyContractsHandler.Handle(email);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError("Lỗi khi lấy danh sách hợp đồng: {Message}", ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
