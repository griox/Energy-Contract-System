namespace Api.VMs;

public class PdfGenerationResult
{
    public bool Success { get; set; }
    public string? PdfUrl { get; set; }
    public string? FileName { get; set; }
    public string? ErrorMessage { get; set; }
}