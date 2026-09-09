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

    /// <summary>ID tin nhắn gốc được trích dẫn trả lời (nếu có)</summary>
    public Guid? ReplyToMessageId { get; set; }

    /// <summary>Nội dung tóm tắt của tin nhắn được trả lời</summary>
    public string? ReplyToContent { get; set; }

    /// <summary>Tên người gửi của tin nhắn được trả lời</summary>
    public string? ReplyToSenderName { get; set; }
}
