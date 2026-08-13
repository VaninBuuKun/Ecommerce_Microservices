using Ecommerce.Services.Notifications.Api.Hubs;
using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Persistances;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

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
                    type = notification.Type,
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

    public async Task<List<Notification>> GetByUserIdAsync(long userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await dbContext.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
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
}
