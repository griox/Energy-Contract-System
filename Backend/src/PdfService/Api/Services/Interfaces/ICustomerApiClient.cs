using System.Threading.Tasks;

namespace Api.Services.Interfaces;

public interface ICustomerApiClient
{
    Task UpdateContractPdfUrlAsync(string contractNumber, string pdfUrl);
}