namespace Ecommerce.Services.Notifications.Api.Models;

/// <summary>
/// Chat message giữa buyer và shop.
/// </summary>
public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>RoomId liên kết đến ChatRoom</summary>
    public Guid RoomId { get; set; }

    /// <summary>UserId người gửi</summary>
    public long SenderId { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
}

