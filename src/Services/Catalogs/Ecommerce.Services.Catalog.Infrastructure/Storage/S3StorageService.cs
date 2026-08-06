using System;
using Amazon.S3;
using Amazon.S3.Model;
using Ecommerce.Services.Catalog.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Ecommerce.Services.Catalog.Infrastructure.Storage;

public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _serviceUrl;

    public S3StorageService(IConfiguration configuration)
    {
        var accessKey = configuration["StorageSettings:AccessKey"] ?? "minioadmin";
        var secretKey = configuration["StorageSettings:SecretKey"] ?? "minioadminpassword";
        _serviceUrl = configuration["StorageSettings:ServiceUrl"] ?? "http://localhost:9000";
        _bucketName = configuration["StorageSettings:BucketName"] ?? "catalog-images";

        var config = new AmazonS3Config
        {
            ServiceURL = _serviceUrl,
            ForcePathStyle = true, // Cần thiết khi kết nối với MinIO local
            UseHttp = true
        };

        _s3Client = new AmazonS3Client(accessKey, secretKey, config);
    }

    public string GeneratePresignedUrlForUpload(string fileName, string contentType, double durationInMinutes = 15)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = fileName,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddMinutes(durationInMinutes),
            Protocol = Protocol.HTTP
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public string GetPublicUrl(string fileName)
    {
        // Trả về trực tiếp URL công khai để client load ảnh từ MinIO/S3
        return $"{_serviceUrl}/{_bucketName}/{fileName}";
    }
}
