using Ecommerce.Services.Notifications.Api.Models;
using Ecommerce.Services.Notifications.Api.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;

namespace Ecommerce.Services.Notifications.Api.Consumers;

/// <summary>
/// Khi SubOrder được tạo → notify seller có đơn hàng mới.
/// UserId của seller được lấy từ ShopId (hiện tại map qua ShopId field trong event).
/// NOTE: Event SubOrderCreatedEvent có CustomerId và ShopId, nhưng không có SellerUserId.
/// Để notify seller, cần có SellerUserId — tạm thời notify via ShopId group.
/// TODO: Khi có thêm SellerUserId trong event thì update.
/// </summary>
public class SubOrderCreatedNotificationConsumer(
    INotificationService notificationService,
    ILogger<SubOrderCreatedNotificationConsumer> logger
) : IConsumer<SubOrderCreatedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderCreatedEvent> context)
    {
        var message = context.Message;
        logger.LogInformation("Sending new order notification for SubOrder {SubOrderId}, Shop {ShopId}",
            message.SubOrderId, message.ShopId);

        // Notify buyer — xác nhận đơn đã được tạo
        var buyerNotification = new Notification
        {
            UserId = message.CustomerId,
            Title = "Đặt hàng thành công!",
            Body = $"Đơn hàng của bạn đã được tạo. Mã đơn: {message.OrderId}",
            Type = "OrderCreated",
            ReferenceId = message.OrderId.ToString()
        };

        await notificationService.SendAsync(buyerNotification, context.CancellationToken);
    }
}
