using Api.Services.Interfaces;
using Api.VMs; // Đảm bảo namespace chứa ContractPdfRequest và OrderPdfDto
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq; // Cần cho .Any()
using System.Text; // Cần cho StringBuilder
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

            // =========================================================================
            // 2. XỬ LÝ DỮ LIỆU: Tạo các dòng HTML cho bảng Order
            // =========================================================================
            var sbOrders = new StringBuilder();

            if (request.Orders != null && request.Orders.Any())
            {
                foreach (var order in request.Orders)
                {
                    // Format dữ liệu hiển thị
                    string period = $"{order.StartDate:dd/MM/yyyy} - {order.EndDate:dd/MM/yyyy}";
                    string fee = order.TopupFee.ToString("N0"); // N0: 1,000 | N2: 1,000.00

                    // Mapping Enum sang tên hiển thị (Bạn có thể tách ra hàm riêng nếu muốn)
                    string typeName = order.OrderType == 1 ? "Gas" : "Electricity"; 
                    
                    // Logic màu sắc đơn giản cho Status
                    string statusName = order.Status == 1 ? "Active" : "Pending";
                    string statusColor = order.Status == 1 ? "#27ae60" : "#f39c12"; // Xanh hoặc Cam

                    // Tạo dòng TR
                    sbOrders.AppendLine($@"
                        <tr>
                            <td><strong>{order.OrderNumber}</strong></td>
                            <td>{typeName}</td>
                            <td>{period}</td>
                            <td style='color:{statusColor}; font-weight:bold;'>{statusName}</td>
                            <td style='text-align: right;'>{fee}</td>
                        </tr>");
                }
            }
            else
            {
                // Nếu không có Order nào
                sbOrders.AppendLine("<tr><td colspan='5' style='text-align:center; padding: 20px;'>No services registered in this contract.</td></tr>");
            }

            // 3. Chuẩn bị dữ liệu map vào Template
            var templateData = new Dictionary<string, string>
            {
                // Thông tin chung
                { "ContractNumber", request.ContractNumber },
                { "GeneratedDate", DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm") },
                
                // Thông tin khách hàng
                { "FullName", $"{request.FirstName} {request.LastName}".Trim() },
                { "FirstName", request.FirstName },
                { "LastName", request.LastName },
                { "Email", request.Email },
                { "Phone", request.Phone },
                { "CompanyName", request.CompanyName ?? "N/A" },
                { "BankAccount", request.BankAccountNumber ?? "N/A" },
                { "Address", request.AddressLine ?? "" }, // Template mới có thể không dùng, nhưng cứ giữ lại
                
                // Thông tin hợp đồng
                { "StartDate", request.StartDate.ToString("dd/MM/yyyy") },
                { "EndDate", request.EndDate.ToString("dd/MM/yyyy") },
                { "TotalAmount", request.TotalAmount.ToString("N0") },
                { "Currency", request.Currency },

                // QUAN TRỌNG: Chèn chuỗi HTML danh sách Order vào đây
                { "OrderRows", sbOrders.ToString() }
            };

            // 4. Render HTML (Thay thế biến)
            var renderedHtml = _templateService.RenderTemplate(htmlTemplate, templateData);

            // 5. Generate PDF (Puppeteer/Chromium)
            var pdfBytes = await _pdfGenerator.GeneratePdfFromHtmlAsync(renderedHtml);

            // 6. Upload lên Storage
            var fileName = $"contract_{request.ContractNumber}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            var pdfUrl = await _storageService.UploadPdfAsync(pdfBytes, fileName);

            _logger.LogInformation($"PDF generated & uploaded: {fileName}");

            // 7. Cập nhật URL sang Customer Service
            try 
            {
                _logger.LogInformation("Updating Contract PdfUrl in Customer Service...");
                await _customerApiClient.UpdateContractPdfUrlAsync(request.ContractNumber, pdfUrl);
            }
            catch(Exception ex)
            {
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