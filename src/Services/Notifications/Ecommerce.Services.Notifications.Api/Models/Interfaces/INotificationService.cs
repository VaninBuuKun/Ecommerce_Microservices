using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Models.Entities;

namespace Ecommerce.Services.Notifications.Api.Models.Interfaces;

public interface INotificationService
{
    /// <summary>Lưu notification vào DB và push realtime qua SignalR đến user.</summary>
    Task SendAsync(Notification notification, CancellationToken cancellationToken = default);

    /// <summary>Lấy danh sách notification của user (có phân trang).</summary>
    Task<List<Notification>> GetByUserIdAsync(long userId, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);



    /// <summary>Đánh dấu notification đã đọc.</summary>
    Task MarkAsReadAsync(Guid notificationId, long userId, CancellationToken cancellationToken = default);

    /// <summary>Đánh dấu tất cả notification của user đã đọc.</summary>
    Task MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default);
}
