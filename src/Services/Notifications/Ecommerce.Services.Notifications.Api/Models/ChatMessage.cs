namespace Ecommerce.Services.Notifications.Api.Models;

/// <summary>
/// Chat message giữa buyer và seller trong context của một SubOrder.
/// Group pattern: "chat-suborder-{subOrderId}"
/// </summary>
public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>SubOrderId để group chat đúng room</summary>
    public Guid SubOrderId { get; set; }

    /// <summary>UserId người gửi</summary>
    public long SenderId { get; set; }

    /// <summary>Tên hiển thị người gửi</summary>
    public string SenderName { get; set; } = string.Empty;

    /// <summary>Buyer hoặc Seller</summary>
    public string SenderRole { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
}
