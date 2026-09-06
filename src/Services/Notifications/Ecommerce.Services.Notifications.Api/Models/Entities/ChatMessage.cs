using System;

namespace Ecommerce.Services.Notifications.Api.Models.Entities;

public enum ChatMessageType
{
    Text,
    Image,
    Video,
    Sticker,
    Gif,
    Icon
}

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

    public ChatMessageType MessageType { get; set; } = ChatMessageType.Text;

    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
}
