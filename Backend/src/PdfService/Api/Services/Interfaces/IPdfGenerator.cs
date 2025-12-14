namespace Api.Services.Interfaces;

public interface IPdfGenerator
{
    Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent);
}