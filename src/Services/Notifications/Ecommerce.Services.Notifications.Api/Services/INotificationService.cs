using Ecommerce.Services.Notifications.Api.Models;

namespace Ecommerce.Services.Notifications.Api.Services;

public interface INotificationService
{
    /// <summary>Lưu notification vào DB và push realtime qua SignalR đến user.</summary>
    Task SendAsync(Notification notification, CancellationToken cancellationToken = default);

    /// <summary>Lấy danh sách notification của user (có phân trang).</summary>
    Task<List<Notification>> GetByUserIdAsync(long userId, int page, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>Đánh dấu notification đã đọc.</summary>
    Task MarkAsReadAsync(Guid notificationId, long userId, CancellationToken cancellationToken = default);

    /// <summary>Đánh dấu tất cả notification của user đã đọc.</summary>
    Task MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default);
}
