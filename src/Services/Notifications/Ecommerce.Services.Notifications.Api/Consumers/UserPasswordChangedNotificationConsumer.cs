using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Events;
using Ecommerce.Services.Notifications.Api.Hubs;
using Ecommerce.Services.Notifications.Api.Models.Entities;
using Ecommerce.Services.Notifications.Api.Models.Interfaces;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>
/// Khi người dùng đổi mật khẩu hoặc reset mật khẩu thành công:
/// 1. Gửi Email thông báo bảo mật
/// 2. Bắn SignalR ForceLogout đến toàn bộ trình duyệt / thiết bị của user đó
/// 3. Lưu In-app notification
/// </summary>
public class UserPasswordChangedNotificationConsumer(
    IEmailService emailService,
    INotificationService notificationService,
    IHubContext<NotificationHub> hubContext,
    ILogger<UserPasswordChangedNotificationConsumer> logger
) : IConsumer<UserPasswordChangedEvent>
{
    public async Task Consume(ConsumeContext<UserPasswordChangedEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Processing UserPasswordChangedEvent for User {UserId}, Email {Email}",
            message.UserId, message.Email);

        // 1. Gửi Email thông báo bảo mật
        try
        {
            await emailService.SendPasswordChangedEmailAsync(
                message.Email,
                message.FullName,
                message.ChangedAt);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send password changed alert email to {Email}", message.Email);
        }

        // 2. Bắn SignalR ForceLogout đến toàn bộ kết nối của User này
        try
        {
            await hubContext.Clients.Group(message.UserId.ToString()).SendAsync("ForceLogout", new
            {
                reason = "Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại.",
                changedAt = message.ChangedAt
            }, context.CancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send SignalR ForceLogout to User {UserId}", message.UserId);
        }

        // 3. Gửi In-app notification
        var notification = new Notification
        {
            UserId = message.UserId,
            Title = "🔒 Mật khẩu tài khoản đã được thay đổi",
            Body = $"Mật khẩu của bạn đã được cập nhật thành công lúc {message.ChangedAt:HH:mm:ss dd/MM/yyyy} UTC. Tất cả phiên đăng nhập khác đã được thu hồi.",
            Type = NotificationType.PasswordChanged,
            ReferenceId = message.UserId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
