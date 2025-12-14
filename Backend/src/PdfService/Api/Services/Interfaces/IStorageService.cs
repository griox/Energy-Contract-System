namespace Api.Services.Interfaces;

public interface IStorageService
{
    Task<string> UploadPdfAsync(byte[] pdfBytes, string fileName, string folder = "contracts");
    Task<bool> DeleteFileAsync(string fileUrl);
    Task<byte[]> DownloadFileAsync(string key);
}