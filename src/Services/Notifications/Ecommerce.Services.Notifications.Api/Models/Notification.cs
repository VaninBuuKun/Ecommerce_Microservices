namespace Ecommerce.Services.Notifications.Api.Models;

/// <summary>Lưu lịch sử thông báo gửi đến người dùng.</summary>
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Người nhận thông báo (UserId)</summary>
    public long UserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    /// <summary>Loại thông báo: OrderCreated, PaymentSucceeded, PaymentFailed, SubOrderShipped, ...</summary>
    public NotificationType Type { get; set; } = NotificationType.SystemAlert;


    /// <summary>ID của entity liên quan (SubOrderId, OrderId, ...)</summary>
    public string? ReferenceId { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
