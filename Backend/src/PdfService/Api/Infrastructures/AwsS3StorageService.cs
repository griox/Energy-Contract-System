using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Api.Services.Interfaces;
namespace Api.Infrastructures;

public class AwsS3StorageService : IStorageService

{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _region;
    private readonly ILogger<AwsS3StorageService> _logger;

    public AwsS3StorageService(
        IAmazonS3 s3Client,
        IConfiguration configuration,
        ILogger<AwsS3StorageService> logger)
    {
        _s3Client = s3Client;
        _bucketName = configuration["AWS:BucketName"] ?? "energy-contracts";
        _region = configuration["AWS:Region"] ?? "ap-southeast-1";
        _logger = logger;
        
        // Auto-create bucket if doesn't exist (optional for production)
        EnsureBucketExistsAsync().Wait();
    }

    private async Task EnsureBucketExistsAsync()
    {
        try
        {
            var bucketExists = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);
            
            if (!bucketExists)
            {
                _logger.LogInformation($"Creating S3 bucket: {_bucketName}");
                
                var putBucketRequest = new PutBucketRequest
                {
                    BucketName = _bucketName,
                    UseClientRegion = true
                };
                
                await _s3Client.PutBucketAsync(putBucketRequest);
                _logger.LogInformation($"S3 bucket created successfully: {_bucketName}");
            }
            else
            {
                _logger.LogInformation($"S3 bucket already exists: {_bucketName}");
            }
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            // Bucket exists but we don't have permission to check or it's in another region
            _logger.LogWarning($"Bucket {_bucketName} exists but access is restricted. Assuming it's available.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error checking/creating S3 bucket: {_bucketName}");
            throw;
        }
    }

    public async Task<string> UploadPdfAsync(byte[] pdfBytes, string fileName, string folder = "contracts")
    {
        // Key format: contracts/2024/01/15/contract_CT-2024-001_20240115103000.pdf
        var key = $"{folder}/{DateTime.UtcNow:yyyy/MM/dd}/{fileName}";
        
        try
        {
            _logger.LogInformation($"Uploading file to S3: {key}");
            
            using var memoryStream = new MemoryStream(pdfBytes);
            
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = memoryStream,
                Key = key,
                BucketName = _bucketName,
                ContentType = "application/pdf",
                
                // IMPORTANT: Set ACL based on your requirements
                // Option 1: Private (recommended) - Need presigned URL to access
                CannedACL = S3CannedACL.Private,
                
                // Option 2: Public read - Anyone can access via URL
                // CannedACL = S3CannedACL.PublicRead,
                
                // Add metadata
                StorageClass = S3StorageClass.Standard
            };
            
            // Add custom metadata
            uploadRequest.Metadata.Add("x-amz-meta-original-filename", fileName);
            uploadRequest.Metadata.Add("x-amz-meta-upload-date", DateTime.UtcNow.ToString("o"));
            uploadRequest.Metadata.Add("x-amz-meta-content-type", "application/pdf");

            var transferUtility = new TransferUtility(_s3Client);
            await transferUtility.UploadAsync(uploadRequest);

            _logger.LogInformation($"File uploaded successfully to S3: {key}");

            // Generate URL based on ACL
            string fileUrl;
            
            if (uploadRequest.CannedACL == S3CannedACL.Private)
            {
                // Generate presigned URL (valid for 7 days)
                fileUrl = GeneratePresignedUrl(key, 7);
            }
            else
            {
                // Generate public URL
                fileUrl = $"https://{_bucketName}.s3.{_region}.amazonaws.com/{key}";
            }

            return fileUrl;
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, $"S3 error uploading file: {fileName}. Error code: {ex.ErrorCode}");
            throw new Exception($"Failed to upload file to S3: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error uploading file to S3: {fileName}");
            throw;
        }
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            var key = ExtractKeyFromUrl(fileUrl);
            
            _logger.LogInformation($"Deleting file from S3: {key}");
            
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            };

            await _s3Client.DeleteObjectAsync(deleteRequest);
            
            _logger.LogInformation($"File deleted successfully from S3: {key}");
            return true;
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, $"S3 error deleting file: {fileUrl}");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting file from S3: {fileUrl}");
            return false;
        }
    }

    /// <summary>
    /// Generate presigned URL for private files
    /// </summary>
    public string GeneratePresignedUrl(string key, int expirationDays = 7)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = key,
                Expires = DateTime.UtcNow.AddDays(expirationDays),
                Protocol = Protocol.HTTPS
            };

            var url = _s3Client.GetPreSignedURL(request);
            _logger.LogDebug($"Generated presigned URL for {key}, expires in {expirationDays} days");
            
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error generating presigned URL for key: {key}");
            throw;
        }
    }

    /// <summary>
    /// Extract S3 key from URL
    /// </summary>
    private string ExtractKeyFromUrl(string url)
    {
        try
        {
            // Handle presigned URL (remove query parameters)
            if (url.Contains("?"))
            {
                url = url.Split('?')[0];
            }

            var uri = new Uri(url);
            
            // Extract key from path
            var key = uri.AbsolutePath.TrimStart('/');
            
            _logger.LogDebug($"Extracted key from URL: {key}");
            return key;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error extracting key from URL: {url}");
            throw;
        }
    }

    /// <summary>
    /// Get file metadata
    /// </summary>
    public async Task<GetObjectMetadataResponse?> GetFileMetadataAsync(string key)
    {
        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _bucketName,
                Key = key
            };

            return await _s3Client.GetObjectMetadataAsync(request);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning($"File not found in S3: {key}");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting file metadata: {key}");
            throw;
        }
    }

    /// <summary>
    /// Check if file exists
    /// </summary>
    public async Task<bool> FileExistsAsync(string key)
    {
        var metadata = await GetFileMetadataAsync(key);
        return metadata != null;
    }

    /// <summary>
    /// Download file as byte array
    /// </summary>
    public async Task<byte[]> DownloadFileAsync(string key)
    {
        try
        {
            // Decode key phòng trường hợp URL bị mã hóa (space -> %20)
            key = System.Net.WebUtility.UrlDecode(key);

            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            };

            using var response = await _s3Client.GetObjectAsync(request);
            using var ms = new MemoryStream();
            await response.ResponseStream.CopyToAsync(ms);
            return ms.ToArray();
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, $"Error downloading file from S3 with key: {key}");
            return Array.Empty<byte>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Unexpected error downloading file: {key}");
            return Array.Empty<byte>();
        }
    }
}