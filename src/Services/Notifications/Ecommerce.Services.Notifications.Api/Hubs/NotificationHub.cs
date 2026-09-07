using BuildingBlocks.Auth;
using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Persistances;
using Ecommerce.Services.Notifications.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Notifications.Api.Hubs;

/// <summary>
/// SignalR Hub phục vụ hai mục đích:
/// 1. Real-time push notification hệ thống đến user (ReceiveNotification).
/// 2. Chat 1v1 giữa Buyer và Seller (ReceiveChatMessage, ReceiveMessageRevoked).
///
/// Groups:
///   - User / Notification: "{userId}" — mỗi user join group theo userId của mình.
///   - Chat Room: "chat-room-{roomId}" — hai bên cùng join group theo phòng chat cụ thể.
/// </summary>
[Authorize]
public class NotificationHub(
    NotificationDbContext dbContext,
    ILogger<NotificationHub> logger
) : Hub
{
    // -----------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------

    private long GetCurrentUserId()
    {
        var idStr = Context.UserIdentifier
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;
        return long.TryParse(idStr, out var id) ? id : 0;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId > 0)
        {
            // Join group theo userId để nhận notification & chat 1v1
            await Groups.AddToGroupAsync(Context.ConnectionId, userId.ToString());
            logger.LogInformation("User {UserId} connected to NotificationHub (ConnectionId: {ConnectionId})", userId, Context.ConnectionId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId();
        if (userId > 0)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId.ToString());
        }
        await base.OnDisconnectedAsync(exception);
    }

    // -----------------------------------------------------------
    // Chat 1v1: Buyer ↔ Seller
    // -----------------------------------------------------------

    /// <summary>
    /// Join vào room chat cụ thể dựa trên RoomId.
    /// Group pattern: "chat-room-{roomId}"
    /// </summary>
    public async Task JoinChatRoom(Guid roomId)
    {
        if (roomId == Guid.Empty) return;
        var groupName = $"chat-room-{roomId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        logger.LogInformation("User {UserId} joined chat room {GroupName}", Context.UserIdentifier, groupName);
    }

    /// <summary>Client gọi để rời chat room.</summary>
    public async Task LeaveChatRoom(Guid roomId)
    {
        if (roomId == Guid.Empty) return;
        var groupName = $"chat-room-{roomId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>Client gửi tin nhắn chat 1v1.</summary>
    public async Task<object?> SendChatMessage(
        string? roomId, 
        string content, 
        long recipientId, 
        string senderRole, 
        string messageType = "Text",
        string? replyToMessageId = null,
        string? replyToContent = null,
        string? replyToSenderName = null)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        var senderId = GetCurrentUserId();
        if (senderId <= 0)
        {
            logger.LogWarning("SendChatMessage: senderId is invalid from user claims.");
            return null;
        }

        Guid parsedRoomId = Guid.Empty;
        if (!string.IsNullOrWhiteSpace(roomId))
        {
            Guid.TryParse(roomId, out parsedRoomId);
        }

        ChatRoom? room = null;

        if (parsedRoomId != Guid.Empty)
        {
            room = await dbContext.ChatRooms.FirstOrDefaultAsync(r => r.Id == parsedRoomId);
        }

        if (room == null)
        {
            // Chat 1v1: gom ShopId và BuyerUserId
            long shopId = senderRole == "Buyer" ? recipientId : senderId;
            long buyerUserId = senderRole == "Buyer" ? senderId : recipientId;

            if (shopId > 0 && buyerUserId > 0)
            {
                room = await dbContext.ChatRooms.FirstOrDefaultAsync(r => r.ShopId == shopId && r.BuyerUserId == buyerUserId);
            }

            if (room == null)
            {
                room = new ChatRoom
                {
                    Id = parsedRoomId != Guid.Empty ? parsedRoomId : Guid.NewGuid(),
                    ShopId = shopId,
                    BuyerUserId = buyerUserId,
                    LastMessage = string.Empty,
                    LastActiveAt = DateTimeOffset.UtcNow
                };
                dbContext.ChatRooms.Add(room);
            }

            parsedRoomId = room.Id;
        }

        Guid? parsedReplyToMessageId = null;
        if (!string.IsNullOrWhiteSpace(replyToMessageId) && Guid.TryParse(replyToMessageId, out var parsedGuid))
        {
            parsedReplyToMessageId = parsedGuid;
        }

        var trimmedContent = content.Trim();
        if (trimmedContent.Length > 2000)
        {
            trimmedContent = trimmedContent.Substring(0, 2000);
        }

        var safeReplyContent = replyToContent;
        if (!string.IsNullOrEmpty(safeReplyContent) && safeReplyContent.Length > 950)
        {
            safeReplyContent = safeReplyContent.Substring(0, 950) + "...";
        }

        var safeReplySenderName = replyToSenderName;
        if (!string.IsNullOrEmpty(safeReplySenderName) && safeReplySenderName.Length > 90)
        {
            safeReplySenderName = safeReplySenderName.Substring(0, 90);
        }

        var msgType = Enum.TryParse<ChatMessageType>(messageType, true, out var parsedType) ? parsedType : ChatMessageType.Text;
        var message = new ChatMessage
        {
            RoomId = parsedRoomId,
            SenderId = senderId,
            Content = trimmedContent,
            MessageType = msgType,
            SentAt = DateTimeOffset.UtcNow,
            ReplyToMessageId = parsedReplyToMessageId,
            ReplyToContent = safeReplyContent,
            ReplyToSenderName = safeReplySenderName
        };

        dbContext.ChatMessages.Add(message);

        // Update preview last message của phòng theo loại nội dung
        if (message.MessageType == ChatMessageType.Image)
        {
            int count = 1;
            var trimmed = message.Content.Trim();
            if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
            {
                try
                {
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(trimmed);
                    count = list?.Count ?? 1;
                }
                catch { }
            }
            room.LastMessage = count > 1 ? $"Đã gửi {count} ảnh" : "Đã gửi 1 ảnh";
        }
        else if (message.MessageType == ChatMessageType.Video)
        {
            int count = 1;
            var trimmed = message.Content.Trim();
            if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
            {
                try
                {
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(trimmed);
                    count = list?.Count ?? 1;
                }
                catch { }
            }
            room.LastMessage = count > 1 ? $"Đã gửi {count} video" : "Đã gửi 1 video";
        }
        else if (message.MessageType == ChatMessageType.Sticker)
        {
            room.LastMessage = "[Sticker 3D]";
        }
        else if (message.MessageType == ChatMessageType.Gif)
        {
            room.LastMessage = "[Ảnh GIF]";
        }
        else
        {
            var text = message.Content;
            if (text.StartsWith("[reply:"))
            {
                var closeIdx = text.IndexOf("}]\n");
                if (closeIdx != -1)
                {
                    text = text.Substring(closeIdx + 3).Trim();
                }
                else
                {
                    closeIdx = text.IndexOf("}]");
                    if (closeIdx != -1)
                    {
                        text = text.Substring(closeIdx + 2).Trim();
                    }
                }
            }
            if (text.Contains("\"}]"))
            {
                var leakedIdx = text.IndexOf("\"}]");
                text = text.Substring(leakedIdx + 3).Trim();
            }
            room.LastMessage = text.Length > 200 ? text.Substring(0, 200) + "..." : text;
        }

        room.LastActiveAt = message.SentAt;

        await dbContext.SaveChangesAsync();

        var chatPayload = new
        {
            id = message.Id,
            roomId = message.RoomId,
            shopId = room.ShopId,
            buyerUserId = room.BuyerUserId,
            senderId = message.SenderId,
            content = message.Content,
            messageType = message.MessageType.ToString(),
            sentAt = message.SentAt,
            replyToMessageId = message.ReplyToMessageId,
            replyToContent = message.ReplyToContent,
            replyToSenderName = message.ReplyToSenderName
        };

        // 1. Luôn thêm kết nối hiện tại vào room group
        var groupName = $"chat-room-{message.RoomId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // 2. Broadcast tin nhắn tới mọi người trong phòng chat
        await Clients.Group(groupName).SendAsync("ReceiveChatMessage", chatPayload);

        // 3. Gửi trực tiếp 1v1 tới tài khoản cá nhân người nhận (nếu họ chưa mở phòng chat)
        try
        {
            if (recipientId > 0 && recipientId != senderId)
            {
                await Clients.Group(recipientId.ToString()).SendAsync("ReceiveChatMessage", chatPayload);
            }
            if (room.BuyerUserId > 0 && room.BuyerUserId != senderId && room.BuyerUserId != recipientId)
            {
                await Clients.Group(room.BuyerUserId.ToString()).SendAsync("ReceiveChatMessage", chatPayload);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not send direct notification to recipient {RecipientId}", recipientId);
        }

        logger.LogInformation("Chat message sent in Room {RoomId} by User {SenderId}", message.RoomId, senderId);
        return chatPayload;
    }

    /// <summary>Thu hồi tin nhắn chat 1v1 ở cả hai phía.</summary>
    public async Task<bool> RevokeChatMessage(Guid messageId, Guid roomId)
    {
        var senderId = GetCurrentUserId();
        if (senderId <= 0) return false;

        var message = await dbContext.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId && m.RoomId == roomId);
        if (message == null) return false;

        if (message.SenderId != senderId)
        {
            logger.LogWarning("User {UserId} unauthorized to revoke message {MessageId}", senderId, messageId);
            return false;
        }

        message.Content = "Tin nhắn đã được thu hồi";
        message.MessageType = ChatMessageType.Text;

        var room = await dbContext.ChatRooms.FirstOrDefaultAsync(r => r.Id == roomId);
        if (room != null)
        {
            room.LastMessage = "Tin nhắn đã được thu hồi";
            room.LastActiveAt = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync();

        var revokePayload = new
        {
            id = message.Id,
            roomId = message.RoomId,
            content = "Tin nhắn đã được thu hồi"
        };

        var groupName = $"chat-room-{roomId}";
        await Clients.Group(groupName).SendAsync("ReceiveMessageRevoked", revokePayload);

        // Gửi thông báo thu hồi trực tiếp 1v1 tới người còn lại
        if (room != null)
        {
            var otherUserId = senderId == room.BuyerUserId ? 0 : room.BuyerUserId;
            if (otherUserId > 0)
            {
                await Clients.Group(otherUserId.ToString()).SendAsync("ReceiveMessageRevoked", revokePayload);
            }
        }

        logger.LogInformation("Message {MessageId} in Room {RoomId} revoked by User {SenderId}", messageId, roomId, senderId);
        return true;
    }

    /// <summary>Lấy lịch sử chat của Room hỗ trợ scrolling (kéo lên để load tin nhắn cũ hơn).</summary>
    public async Task<List<object>> GetChatHistory(Guid roomId, Guid? beforeMessageId = null, int limit = 30)
    {
        var query = dbContext.ChatMessages.Where(m => m.RoomId == roomId);

        if (beforeMessageId.HasValue && beforeMessageId != Guid.Empty)
        {
            var beforeMessage = await dbContext.ChatMessages.FirstOrDefaultAsync(m => m.Id == beforeMessageId.Value);
            if (beforeMessage != null)
            {
                query = query.Where(m => m.SentAt < beforeMessage.SentAt);
            }
        }

        var rawMessages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(limit)
            .Select(m => new
            {
                id = m.Id,
                roomId = m.RoomId,
                senderId = m.SenderId,
                content = m.Content,
                messageType = m.MessageType.ToString(),
                sentAt = m.SentAt,
                replyToMessageId = m.ReplyToMessageId,
                replyToContent = m.ReplyToContent,
                replyToSenderName = m.ReplyToSenderName
            })
            .ToListAsync();

        var messages = rawMessages.Select(m => (object)new
        {
            id = m.id,
            roomId = m.roomId,
            senderId = m.senderId,
            content = m.content,
            messageType = m.messageType,
            sentAt = m.sentAt,
            replyToMessageId = m.replyToMessageId,
            replyToContent = m.replyToContent,
            replyToSenderName = m.replyToSenderName
        }).ToList();

        messages.Reverse();
        return messages;
    }
}
