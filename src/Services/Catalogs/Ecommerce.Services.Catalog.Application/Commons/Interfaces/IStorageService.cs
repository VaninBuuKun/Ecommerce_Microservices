namespace Ecommerce.Services.Catalog.Application.Common.Interfaces;

public interface IStorageService
{
    /// <summary>
    /// Tạo một Presigned URL tạm thời cho phép Client upload ảnh trực tiếp lên S3/MinIO.
    /// </summary>
    string GeneratePresignedUrlForUpload(string fileName, string contentType, double durationInMinutes = 15);

    /// <summary>
    /// Lấy public URL để hiển thị ảnh trên UI.
    /// </summary>
    string GetPublicUrl(string fileName);
}
