using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>Thanh toán thành công → notify buyer.</summary>
public class PaymentSucceededNotificationConsumer(
    INotificationService notificationService,
    ILogger<PaymentSucceededNotificationConsumer> logger
) : IConsumer<PaymentSucceededEvent>
{
    public async Task Consume(ConsumeContext<PaymentSucceededEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Sending payment succeeded notification for Order {OrderId}, Customer {CustomerId}",
            message.OrderId, message.CustomerId);

        var notification = new Notification
        {
            UserId = message.CustomerId,
            Title = "Thanh toán thành công!",
            Body = $"Đơn hàng #{message.OrderId} đã được thanh toán thành công. Người bán đang chuẩn bị hàng.",
            Type = "PaymentSucceeded",
            ReferenceId = message.OrderId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
