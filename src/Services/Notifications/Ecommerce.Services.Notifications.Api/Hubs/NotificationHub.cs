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
/// 2. Chat peer-to-peer giữa buyer và seller trong context của một SubOrder (ReceiveChatMessage).
///
/// Groups:
///   - Notification: "{userId}" — mỗi user join group theo userId của mình.
///   - Chat: "chat-suborder-{subOrderId}" — buyer và seller cùng join group này.
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
            // Join group theo userId để nhận notification & chat
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
    // Chat: buyer ↔ Shop
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

    /// <summary>
    /// Join vào kênh thông báo chung của Shop (dành cho Staff Portal nhận thông báo tin nhắn mới).
    /// Group pattern: "shop-channel-{shopId}"
    /// </summary>
    public async Task JoinShopChannel(long shopId)
    {
        if (shopId <= 0) return;
        var groupName = $"shop-channel-{shopId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        logger.LogInformation("Staff {UserId} joined shop channel group {GroupName}", Context.UserIdentifier, groupName);
    }

    /// <summary>Client gửi tin nhắn chat. Tự động khởi tạo ChatRoom nếu roomId chưa tồn tại (Default/Empty).</summary>
    public async Task<object?> SendChatMessage(Guid roomId, string content, long recipientId, string senderRole, string messageType = "Text")
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        var senderId = GetCurrentUserId();
        if (senderId <= 0)
        {
            logger.LogWarning("SendChatMessage: senderId is invalid from user claims.");
            return null;
        }

        ChatRoom? room = null;

        if (roomId == Guid.Empty)
        {
            // Chat với Shop: gom ShopId và BuyerUserId
            long shopId = senderRole == "Buyer" ? recipientId : senderId;
            long buyerUserId = senderRole == "Buyer" ? senderId : recipientId;

            room = await dbContext.ChatRooms.FirstOrDefaultAsync(r => r.ShopId == shopId && r.BuyerUserId == buyerUserId);
            if (room == null)
            {
                room = new ChatRoom
                {
                    Id = Guid.NewGuid(),
                    ShopId = shopId,
                    BuyerUserId = buyerUserId,
                    LastMessage = string.Empty,
                    LastActiveAt = DateTimeOffset.UtcNow
                };
                dbContext.ChatRooms.Add(room);
            }

            roomId = room.Id;
        }
        else
        {
            room = await dbContext.ChatRooms.FirstOrDefaultAsync(r => r.Id == roomId);
        }

        if (room == null) return null;

        var msgType = Enum.TryParse<ChatMessageType>(messageType, true, out var parsedType) ? parsedType : ChatMessageType.Text;
        var message = new ChatMessage
        {
            RoomId = roomId,
            SenderId = senderId,
            Content = content.Trim(),
            MessageType = msgType,
            SentAt = DateTimeOffset.UtcNow
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
            room.LastMessage = message.Content.Length > 200 ? message.Content.Substring(0, 200) + "..." : message.Content;
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
            sentAt = message.SentAt
        };

        // 1. Luôn thêm kết nối hiện tại vào room group
        var groupName = $"chat-room-{roomId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // 2. Broadcast tin nhắn tới mọi người trong phòng chat
        await Clients.Group(groupName).SendAsync("ReceiveChatMessage", chatPayload);

        // 3. Multi-cast trực tiếp tới người nhận (kênh shop hoặc group cá nhân người mua) để đảm bảo không bị lỡ tin
        if (senderRole == "Buyer")
        {
            var shopChannelName = $"shop-channel-{room.ShopId}";
            await Clients.Group(shopChannelName).SendAsync("ReceiveChatMessage", chatPayload);
            await Clients.Group(shopChannelName).SendAsync("NewChatNotification", new
            {
                roomId = room.Id,
                shopId = room.ShopId,
                buyerUserId = room.BuyerUserId,
                lastMessage = room.LastMessage,
                lastActiveAt = room.LastActiveAt
            });
        }
        else
        {
            await Clients.Group(room.BuyerUserId.ToString()).SendAsync("ReceiveChatMessage", chatPayload);
        }

        logger.LogInformation("Chat message sent in Room {RoomId} by User {SenderId}", roomId, senderId);
        return chatPayload;
    }

    /// <summary>Thu hồi tin nhắn chat ở cả hai phía (Sender & Recipient).</summary>
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

        if (room != null)
        {
            var shopChannelName = $"shop-channel-{room.ShopId}";
            await Clients.Group(shopChannelName).SendAsync("ReceiveMessageRevoked", revokePayload);
            await Clients.Group(room.BuyerUserId.ToString()).SendAsync("ReceiveMessageRevoked", revokePayload);
        }

        logger.LogInformation("Message {MessageId} in Room {RoomId} revoked by User {SenderId}", messageId, roomId, senderId);
        return true;
    }

    /// <summary>Thả biểu tượng cảm xúc (Reaction) vào tin nhắn.</summary>
    public async Task<bool> ReactToChatMessage(Guid messageId, Guid roomId, string emoji)
    {
        var senderId = GetCurrentUserId();
        if (senderId <= 0 || string.IsNullOrWhiteSpace(emoji)) return false;

        var reactionPayload = new
        {
            messageId,
            roomId,
            senderId,
            emoji = emoji.Trim()
        };

        var groupName = $"chat-room-{roomId}";
        await Clients.Group(groupName).SendAsync("ReceiveMessageReaction", reactionPayload);
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

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(limit)
            .Select(m => (object)new
            {
                id = m.Id,
                roomId = m.RoomId,
                senderId = m.SenderId,
                content = m.Content,
                messageType = m.MessageType.ToString(),
                sentAt = m.SentAt
            })
            .ToListAsync();

        messages.Reverse();
        return messages;
    }
}
