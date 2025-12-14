namespace Api.VMs;

public class ContractPdfResponse
{
    public bool Success { get; set; }
    public string? PdfUrl { get; set; }
    public string? FileName { get; set; }
    public string? ErrorMessage { get; set; }
}