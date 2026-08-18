using BuildingBlocks.Auth;
using Ecommerce.Services.Notifications.Api.Models;
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

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            // Join group theo userId để nhận notification
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            logger.LogInformation("User {UserId} connected to NotificationHub (ConnectionId: {ConnectionId})", userId, Context.ConnectionId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
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
        var groupName = $"chat-room-{roomId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        logger.LogInformation("User {UserId} joined chat room {GroupName}", Context.UserIdentifier, groupName);
    }

    /// <summary>Client gọi để rời chat room.</summary>
    public async Task LeaveChatRoom(Guid roomId)
    {
        var groupName = $"chat-room-{roomId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Join vào kênh thông báo chung của Shop (dành cho Staff Portal nhận thông báo tin nhắn mới).
    /// Group pattern: "shop-channel-{shopId}"
    /// </summary>
    public async Task JoinShopChannel(long shopId)
    {
        var groupName = $"shop-channel-{shopId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        logger.LogInformation("Staff {UserId} joined shop channel group {GroupName}", Context.UserIdentifier, groupName);
    }

    /// <summary>Client gửi tin nhắn chat. Tự động khởi tạo ChatRoom nếu roomId chưa tồn tại (Default/Empty).</summary>
    public async Task SendChatMessage(Guid roomId, string content, long recipientId, string senderRole)
    {
        if (string.IsNullOrWhiteSpace(content)) return;
        if (!long.TryParse(Context.UserIdentifier, out var senderId)) return;

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

        if (room == null) return;

        var message = new ChatMessage
        {
            RoomId = roomId,
            SenderId = senderId,
            Content = content.Trim(),
            SentAt = DateTimeOffset.UtcNow
        };

        dbContext.ChatMessages.Add(message);

        // Update preview last message của phòng
        room.LastMessage = message.Content.Length > 200 ? message.Content.Substring(0, 200) + "..." : message.Content;
        room.LastActiveAt = message.SentAt;

        await dbContext.SaveChangesAsync();

        // 1. Broadcast tin nhắn tới mọi người trong phòng chat
        var groupName = $"chat-room-{roomId}";
        await Clients.Group(groupName).SendAsync("ReceiveChatMessage", new
        {
            id = message.Id,
            roomId = message.RoomId,
            senderId = message.SenderId,
            content = message.Content,
            sentAt = message.SentAt
        });

        // 2. Nếu là Khách hàng nhắn -> Gửi thông báo có tin nhắn mới cho các Staff online của Shop
        if (senderRole == "Buyer")
        {
            var shopChannelName = $"shop-channel-{room.ShopId}";
            await Clients.Group(shopChannelName).SendAsync("NewChatNotification", new
            {
                roomId = room.Id,
                shopId = room.ShopId,
                buyerUserId = room.BuyerUserId,
                lastMessage = room.LastMessage,
                lastActiveAt = room.LastActiveAt
            });
        }

        logger.LogInformation("Chat message sent in Room {RoomId} by User {SenderId}", roomId, senderId);
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
                // Chỉ lấy các tin nhắn cũ hơn tin nhắn trước đó
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
                sentAt = m.SentAt
            })
            .ToListAsync();

        // Đảo ngược danh sách trước khi trả về để hiển thị từ cũ đến mới
        messages.Reverse();
        return messages;
    }
}
