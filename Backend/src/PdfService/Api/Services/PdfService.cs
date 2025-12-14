using Api.Services.Interfaces;
using Api.VMs;

namespace Api.Services;

public class PdfService : IPdfService
{
    private readonly IPdfGenerator _pdfGenerator;
    private readonly IStorageService _storageService;
    private readonly ITemplateService _templateService;
    private readonly ICustomerApiClient _customerApiClient; // [NEW] Inject Client
    private readonly ILogger<PdfService> _logger;

    public PdfService(
        IPdfGenerator pdfGenerator,
        IStorageService storageService,
        ITemplateService templateService,
        ICustomerApiClient customerApiClient, // [NEW]
        ILogger<PdfService> logger)
    {
        _pdfGenerator = pdfGenerator;
        _storageService = storageService;
        _templateService = templateService;
        _customerApiClient = customerApiClient; // [NEW]
        _logger = logger;
    }

    public async Task<PdfGenerationResult> GenerateContractPdfAsync(ContractPdfRequest request)
    {
        try
        {
            _logger.LogInformation($"Generating PDF for contract: {request.ContractNumber}");

            // [NEW LOGIC] 0. Check and delete old file if exists
            if (!string.IsNullOrEmpty(request.CurrentPdfUrl))
            {
                _logger.LogInformation($"Found existing PDF for contract {request.ContractNumber}. Attempting to delete old file...");
                var deleteResult = await _storageService.DeleteFileAsync(request.CurrentPdfUrl);
                if (deleteResult)
                {
                    _logger.LogInformation($"Old PDF deleted successfully: {request.CurrentPdfUrl}");
                }
                else
                {
                    _logger.LogWarning($"Failed to delete old PDF or file not found: {request.CurrentPdfUrl}");
                }
            }

            // 1. Get template based on request or default
            string templateName = !string.IsNullOrEmpty(request.TemplateName)
                ? request.TemplateName
                : "ContractTemplate"; // Default template

            var htmlTemplate = await _templateService.GetTemplateByNameAsync(templateName);

            // 2. Prepare data (Giữ nguyên)
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

            // 3. Render template
            var renderedHtml = _templateService.RenderTemplate(htmlTemplate, templateData);

            // 4. Generate PDF
            var pdfBytes = await _pdfGenerator.GeneratePdfFromHtmlAsync(renderedHtml);

            // 5. Upload to storage
            var fileName = $"contract_{request.ContractNumber}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            var pdfUrl = await _storageService.UploadPdfAsync(pdfBytes, fileName);

            _logger.LogInformation($"PDF generated successfully: {fileName}");

            // 6. [NEW] Update Contract PdfUrl in Customer Service
            // Gọi bất đồng bộ và không cần chờ kết quả để trả về response nhanh hơn (Fire and Forget)
            // Hoặc await nếu muốn đảm bảo update thành công mới trả về.
            await _customerApiClient.UpdateContractPdfUrlAsync(request.ContractNumber, pdfUrl);

            return new PdfGenerationResult
            {
                Success = true,
                PdfUrl = pdfUrl,
                FileName = fileName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error generating PDF for contract: {request.ContractNumber}");
            return new PdfGenerationResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<byte[]> DownloadPdfAsync(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl)) return Array.Empty<byte>();

        try 
        {
            // Logic đơn giản để lấy Key từ URL (bỏ phần domain)
            // Ví dụ: https://bucket.s3.../contracts/file.pdf -> contracts/file.pdf
            Uri uri = new Uri(fileUrl);
            string key = uri.AbsolutePath.TrimStart('/');
            
            // Nếu URL có chứa tên bucket ở path đầu tiên (path-style url), cần cắt bỏ nó đi
            // Tùy thuộc vào cấu hình S3 của bạn. Ở đây giả định key là phần path.
            
            return await _storageService.DownloadFileAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to process download for URL: {fileUrl}");
            return Array.Empty<byte>();
        }
    }
}