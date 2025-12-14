using Api.Services.Interfaces;
using Minio;
using Minio.DataModel.Args;

namespace Api.Infrastructures;

public class MinioStorageService : IStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly string _bucketName;
    private readonly ILogger<MinioStorageService> _logger;

    public MinioStorageService(
        IMinioClient minioClient,
        IConfiguration configuration,
        ILogger<MinioStorageService> logger)
    {
        _minioClient = minioClient;
        _bucketName = configuration["Minio:BucketName"] ?? "energy-contracts";
        _logger = logger;

        EnsureBucketExistsAsync().Wait();
    }

    private async Task EnsureBucketExistsAsync()
    {
        try
        {
            var bucketExists = await _minioClient.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(_bucketName));

            if (!bucketExists)
            {
                _logger.LogInformation($"Creating MinIO bucket: {_bucketName}");
                await _minioClient.MakeBucketAsync(
                    new MakeBucketArgs().WithBucket(_bucketName));
                _logger.LogInformation($"MinIO bucket created: {_bucketName}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error checking/creating MinIO bucket: {_bucketName}");
            throw;
        }
    }

    public async Task<string> UploadPdfAsync(byte[] pdfBytes, string fileName, string folder = "contracts")
    {
        var objectName = $"{folder}/{DateTime.UtcNow:yyyy/MM/dd}/{fileName}";

        try
        {
            _logger.LogInformation($"Uploading file to MinIO: {objectName}");

            using var memoryStream = new MemoryStream(pdfBytes);

            await _minioClient.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName)
                .WithStreamData(memoryStream)
                .WithObjectSize(memoryStream.Length)
                .WithContentType("application/pdf"));

            _logger.LogInformation($"File uploaded successfully to MinIO: {objectName}");

            // Generate presigned URL (valid for 7 days)
            var presignedUrl = await _minioClient.PresignedGetObjectAsync(
                new PresignedGetObjectArgs()
                    .WithBucket(_bucketName)
                    .WithObject(objectName)
                    .WithExpiry(60 * 60 * 24 * 7)); // 7 days

            return presignedUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error uploading file to MinIO: {fileName}");
            throw new Exception($"Failed to upload file to MinIO: {ex.Message}", ex);
        }
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            var objectName = ExtractObjectNameFromUrl(fileUrl);

            _logger.LogInformation($"Deleting file from MinIO: {objectName}");

            await _minioClient.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName));

            _logger.LogInformation($"File deleted successfully from MinIO: {objectName}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting file from MinIO: {fileUrl}");
            return false;
        }
    }

    public Task<byte[]> DownloadFileAsync(string key)
    {
        throw new NotImplementedException();
    }

    private string ExtractObjectNameFromUrl(string url)
    {
        if (url.Contains("?"))
        {
            url = url.Split('?')[0];
        }

        var uri = new Uri(url);
        return uri.AbsolutePath.TrimStart('/').Replace($"{_bucketName}/", "");
    }
}
