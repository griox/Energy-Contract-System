using Api.Services.Interfaces;
using Api.VMs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;
[ApiController]
[Route("api/pdf-contract")]
[Authorize]
public class ContractPdfController : ControllerBase
{
    private readonly IPdfService _pdfService;
    private readonly ILogger<ContractPdfController> _logger;
    public ContractPdfController(IPdfService pdfService, ILogger<ContractPdfController> logger)
    {
        _pdfService = pdfService;
        _logger = logger;
    }
    /// <summary>
    /// Generate PDF for a contract
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(ContractPdfResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateContractPdf([FromBody] ContractPdfRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        _logger.LogInformation($"Received request to generate PDF for contract: {request.ContractNumber}");

        var result = await _pdfService.GenerateContractPdfAsync(request);

        if (!result.Success)
        {
            return BadRequest(new ContractPdfResponse
            {
                Success = false,
                ErrorMessage = result.ErrorMessage
            });
        }

        return Ok(new ContractPdfResponse
        {
            Success = true,
            PdfUrl = result.PdfUrl,
            FileName = result.FileName
        });
    }
    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult HealthCheck()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
    /// <summary>
    /// Download PDF file from S3
    /// </summary>
    [HttpPost("download")]
    public async Task<IActionResult> DownloadPdf([FromBody] DownloadPdfRequest request)
    {
        if (string.IsNullOrEmpty(request.FileUrl))
        {
            return BadRequest("File URL is required");
        }

        try
        {
            // 1. Extract Key từ URL (Logic này nên nằm trong Service, nhưng gọi tạm ở đây hoặc qua IStorageService)
            // Lưu ý: IStorageService của bạn đã có hàm ExtractKeyFromUrl nhưng là private. 
            // Bạn cần public hàm đó hoặc xử lý logic lấy key ở đây.
            
            // Giả sử URL dạng: https://bucket.s3.region.amazonaws.com/contracts/2024/.../file.pdf
            // Hoặc Presigned URL dài ngoằng.
            
            // Cách đơn giản nhất: Gọi Service để download byte[]
            // Cần sửa IStorageService để expose hàm DownloadFileAsync nhận URL hoặc Key
            
            // Ở đây tôi giả định bạn sẽ sửa IStorageService để có hàm DownloadFileByUrlAsync
            // Hoặc dùng lại logic ExtractKey có sẵn trong DeleteFileAsync
            
            var fileBytes = await _pdfService.DownloadPdfAsync(request.FileUrl);

            if (fileBytes == null || fileBytes.Length == 0)
            {
                return NotFound("File not found or could not be downloaded");
            }

            // Lấy tên file từ URL để trả về header
            var fileName = Path.GetFileName(new Uri(request.FileUrl).AbsolutePath);

            return File(fileBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading PDF");
            return StatusCode(500, "Internal server error while downloading file");
        }
    }

}