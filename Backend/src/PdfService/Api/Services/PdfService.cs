using Api.Services.Interfaces;
using Api.VMs;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Services;

public class PdfService : IPdfService
{
    private readonly IPdfGenerator _pdfGenerator;
    private readonly IStorageService _storageService;
    private readonly ITemplateService _templateService;
    private readonly ICustomerApiClient _customerApiClient;
    private readonly ILogger<PdfService> _logger;

    public PdfService(
        IPdfGenerator pdfGenerator,
        IStorageService storageService,
        ITemplateService templateService,
        ICustomerApiClient customerApiClient,
        ILogger<PdfService> logger)
    {
        _pdfGenerator = pdfGenerator;
        _storageService = storageService;
        _templateService = templateService;
        _customerApiClient = customerApiClient;
        _logger = logger;
    }

    public async Task<PdfGenerationResult> GenerateContractPdfAsync(ContractPdfRequest request)
    {
        try
        {
            _logger.LogInformation($"[START] Generating PDF for contract: {request.ContractNumber}");

            // 0. Xóa file cũ (nếu có)
            if (!string.IsNullOrEmpty(request.CurrentPdfUrl))
            {
                try 
                {
                    // Đặt trong try-catch con để nếu xóa lỗi cũng không chặn việc tạo file mới
                    _logger.LogInformation($"Attempting to delete old PDF: {request.CurrentPdfUrl}");
                    await _storageService.DeleteFileAsync(request.CurrentPdfUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to delete old PDF (ignoring): {ex.Message}");
                }
            }

            // 1. Lấy Template
            string templateName = !string.IsNullOrEmpty(request.TemplateName)
                ? request.TemplateName
                : "ContractTemplate";

            var htmlTemplate = await _templateService.GetTemplateByNameAsync(templateName);

            // 2. Chuẩn bị dữ liệu map
            var templateData = new Dictionary<string, string>
            {
                { "ContractNumber", request.ContractNumber },
                { "StartDate", request.StartDate.ToString("dd/MM/yyyy") },
                { "EndDate", request.EndDate.ToString("dd/MM/yyyy") },
                { "FullName", $"{request.FirstName} {request.LastName}".Trim() },
                { "FirstName", request.FirstName },
                { "LastName", request.LastName },
                { "Email", request.Email },
                { "Phone", request.Phone },
                { "CompanyName", request.CompanyName ?? "N/A" },
                { "BankAccount", request.BankAccountNumber ?? "N/A" },
                { "Address", request.AddressLine },
                { "TotalAmount", request.TotalAmount.ToString("N2") },
                { "Currency", request.Currency },
                { "GeneratedDate", DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm") }
            };

            // 3. Render HTML
            var renderedHtml = _templateService.RenderTemplate(htmlTemplate, templateData);

            // 4. Generate PDF (Bước này hay bị Timeout nhất)
            var pdfBytes = await _pdfGenerator.GeneratePdfFromHtmlAsync(renderedHtml);

            // 5. Upload lên Storage
            var fileName = $"contract_{request.ContractNumber}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            var pdfUrl = await _storageService.UploadPdfAsync(pdfBytes, fileName);

            _logger.LogInformation($"PDF generated & uploaded: {fileName}");

            // 6. Cập nhật URL sang Customer Service
            try 
            {
                _logger.LogInformation("Updating Contract PdfUrl in Customer Service...");
                await _customerApiClient.UpdateContractPdfUrlAsync(request.ContractNumber, pdfUrl);
            }
            catch(Exception ex)
            {
                // Log lỗi nhưng vẫn trả về thành công cho người dùng vì file PDF đã tạo xong rồi
                _logger.LogError(ex, "PDF created but failed to update Customer Service.");
            }

            return new PdfGenerationResult
            {
                Success = true,
                PdfUrl = pdfUrl,
                FileName = fileName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"[FAILED] Error generating PDF for contract: {request.ContractNumber}");
            // Trả về Exception message để Frontend hiển thị toast
            return new PdfGenerationResult
            {
                Success = false,
                ErrorMessage = ex.InnerException?.Message ?? ex.Message
            };
        }
    }

    public async Task<byte[]> DownloadPdfAsync(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl)) return Array.Empty<byte>();

        try 
        {
            Uri uri = new Uri(fileUrl);
            string key = uri.AbsolutePath.TrimStart('/');
            return await _storageService.DownloadFileAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to download file: {fileUrl}");
            return Array.Empty<byte>();
        }
    }
}