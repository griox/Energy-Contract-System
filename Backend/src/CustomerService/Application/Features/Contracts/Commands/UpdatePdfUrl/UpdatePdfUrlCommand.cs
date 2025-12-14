namespace Application.Features.Contracts.Commands.UpdatePdfUrl;

public class UpdatePdfUrlCommand
{
    public string ContractNumber { get; set; } = string.Empty;
    public string PdfUrl { get; set; } = string.Empty;
}