using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>
/// Cảnh báo đăng nhập thiết bị mới -> gửi Email cảnh báo và thông báo in-app.
/// </summary>
public class NewDeviceLoginAlertNotificationConsumer(
    IEmailService emailService,
    INotificationService notificationService,
    ILogger<NewDeviceLoginAlertNotificationConsumer> logger
) : IConsumer<NewDeviceLoginAlertEvent>
{
    public async Task Consume(ConsumeContext<NewDeviceLoginAlertEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Processing NewDeviceLoginAlertEvent for User {UserId}, Email {Email}, Device {Device}",
            message.UserId, message.Email, message.DeviceName);

        // 1. Gửi Email cảnh báo
        try
        {
            await emailService.SendNewDeviceLoginAlertEmailAsync(
                message.Email,
                message.DeviceName,
                message.IpAddress,
                message.LoginTime);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send new device login alert email to {Email}", message.Email);
        }

        // 2. Gửi In-app notification + SignalR
        var notification = new Notification
        {
            UserId = message.UserId,
            Title = "⚠️ Phát hiện đăng nhập từ thiết bị mới",
            Body = $"Tài khoản của bạn vừa đăng nhập từ thiết bị '{message.DeviceName}' (IP: {message.IpAddress}). Nếu không phải bạn, hãy đổi mật khẩu ngay.",
            Type = NotificationType.NewDeviceLogin,
            ReferenceId = message.UserId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
