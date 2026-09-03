using Ecommerce.Services.Notifications.Api.Hubs;
using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Persistances;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using Ecommerce.Services.Notifications.Api.Models.Interfaces;

namespace Ecommerce.Services.Notifications.Api.Services;

public class NotificationService(
    NotificationDbContext dbContext,
    IHubContext<NotificationHub> hubContext,
    ILogger<NotificationService> logger
) : INotificationService
{
    public async Task SendAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        // 1. Lưu vào DB
        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(cancellationToken);

        // 2. Push realtime qua SignalR đến group của UserId
        try
        {
            await hubContext.Clients
                .Group(notification.UserId.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    body = notification.Body,
                    type = notification.Type.ToString(),

                    referenceId = notification.ReferenceId,
                    createdAt = notification.CreatedAt
                }, cancellationToken);
        }
        catch (Exception ex)
        {
            // Push failure không block — notification đã được lưu DB
            logger.LogWarning(ex, "SignalR push failed for User {UserId}, notification still saved to DB", notification.UserId);
        }

        logger.LogInformation("Notification [{Type}] sent to User {UserId}", notification.Type, notification.UserId);
    }

    public async Task<List<Notification>> GetByUserIdAsync(long userId, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        // Chỉ lấy thông báo trong vòng 15 ngày gần nhất
        var fifteenDaysAgo = DateTimeOffset.UtcNow.AddDays(-15);

        return await dbContext.Notifications
            .Where(n => n.UserId == userId && n.CreatedAt >= fifteenDaysAgo)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<Notification?> GetByIdAsync(Guid id, long userId, CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, cancellationToken);

        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return notification;
    }

    public async Task MarkAsReadAsync(Guid notificationId, long userId, CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);

        if (notification is null) return;

        notification.IsRead = true;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default)
    {
        await dbContext.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);
    }

    public async Task<int> PurgeOldNotificationsAsync(int olderThanDays, CancellationToken cancellationToken = default)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-olderThanDays);
        var deletedCount = await dbContext.Notifications
            .Where(n => n.CreatedAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);

        logger.LogInformation("Purged {Count} old notifications older than {Days} days (before {Cutoff})", deletedCount, olderThanDays, cutoff);
        return deletedCount;
    }
}
