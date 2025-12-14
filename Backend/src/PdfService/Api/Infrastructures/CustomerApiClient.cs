using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Api.Infrastructures;

public class CustomerApiClient : ICustomerApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CustomerApiClient> _logger;
    private readonly string _customerApiUrl;

    public CustomerApiClient(HttpClient httpClient, IConfiguration configuration, ILogger<CustomerApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        // Lấy URL của Customer Service từ cấu hình (vd: http://customer-api:8080)
        _customerApiUrl = configuration["CustomerServiceUrl"] ?? "http://customer-api:8080";
    }

    public async Task UpdateContractPdfUrlAsync(string contractNumber, string pdfUrl)
    {
        try
        {
            var payload = new { PdfUrl = pdfUrl };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            // Giả định CustomerService có API: PUT /api/contracts/by-number/{contractNumber}/pdf-link
            var response = await _httpClient.PutAsync($"{_customerApiUrl}/api/contracts/by-number/{contractNumber}/pdf-link", content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Failed to update PDF URL for contract {contractNumber}. Status: {response.StatusCode}");
            }
            else
            {
                _logger.LogInformation($"Updated PDF URL for contract {contractNumber} successfully.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error calling Customer Service to update PDF URL for {contractNumber}");
        }
    }
}