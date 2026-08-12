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
    // Chat: buyer ↔ seller per SubOrder
    // -----------------------------------------------------------

    /// <summary>Client gọi để join vào chat room của 1 SubOrder.</summary>
    public async Task JoinChatRoom(Guid subOrderId)
    {
        var groupName = $"chat-suborder-{subOrderId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        logger.LogInformation("User {UserId} joined chat room {GroupName}", Context.UserIdentifier, groupName);
    }

    /// <summary>Client gọi để rời chat room.</summary>
    public async Task LeaveChatRoom(Guid subOrderId)
    {
        var groupName = $"chat-suborder-{subOrderId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>Client gửi tin nhắn chat. Server lưu DB rồi broadcast đến cả room.</summary>
    public async Task SendChatMessage(Guid subOrderId, string content, string senderName, string senderRole)
    {
        if (string.IsNullOrWhiteSpace(content)) return;

        if (!long.TryParse(Context.UserIdentifier, out var senderId)) return;

        var message = new ChatMessage
        {
            SubOrderId = subOrderId,
            SenderId = senderId,
            SenderName = senderName,
            SenderRole = senderRole,
            Content = content.Trim(),
            SentAt = DateTimeOffset.UtcNow
        };

        dbContext.ChatMessages.Add(message);
        await dbContext.SaveChangesAsync();

        var groupName = $"chat-suborder-{subOrderId}";
        await Clients.Group(groupName).SendAsync("ReceiveChatMessage", new
        {
            id = message.Id,
            subOrderId = message.SubOrderId,
            senderId = message.SenderId,
            senderName = message.SenderName,
            senderRole = message.SenderRole,
            content = message.Content,
            sentAt = message.SentAt
        });

        logger.LogInformation("Chat message sent in SubOrder {SubOrderId} by User {SenderId}", subOrderId, senderId);
    }

    /// <summary>Lấy lịch sử chat của 1 SubOrder (khi client mới load).</summary>
    public async Task<List<object>> GetChatHistory(Guid subOrderId, int take = 50)
    {
        var messages = await dbContext.ChatMessages
            .Where(m => m.SubOrderId == subOrderId)
            .OrderByDescending(m => m.SentAt)
            .Take(take)
            .OrderBy(m => m.SentAt)
            .Select(m => (object)new
            {
                id = m.Id,
                subOrderId = m.SubOrderId,
                senderId = m.SenderId,
                senderName = m.SenderName,
                senderRole = m.SenderRole,
                content = m.Content,
                sentAt = m.SentAt
            })
            .ToListAsync();

        return messages;
    }
}
