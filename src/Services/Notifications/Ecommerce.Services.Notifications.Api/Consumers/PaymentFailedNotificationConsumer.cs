using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>Thanh toán thất bại → notify buyer.</summary>
public class PaymentFailedNotificationConsumer(
    INotificationService notificationService,
    ILogger<PaymentFailedNotificationConsumer> logger
) : IConsumer<PaymentFailedEvent>
{
    public async Task Consume(ConsumeContext<PaymentFailedEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Sending payment failed notification for Order {OrderId}, Customer {CustomerId}",
            message.OriginalOrderId, message.CustomerId);

        var notification = new Notification
        {
            UserId = message.CustomerId,
            Title = "Thanh toán thất bại",
            Body = $"Đơn hàng #{message.OriginalOrderId} chưa được thanh toán. Lý do: {message.Reason}",
            Type = "PaymentFailed",
            ReferenceId = message.OriginalOrderId.ToString()
        };

        await notificationService.SendAsync(notification, context.CancellationToken);
    }
}
