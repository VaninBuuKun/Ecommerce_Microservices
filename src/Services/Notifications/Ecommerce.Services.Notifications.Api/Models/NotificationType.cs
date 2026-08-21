namespace Ecommerce.Services.Notifications.Api.Models;

public enum NotificationType
{
    OrderCreated,
    PaymentSucceeded,
    PaymentFailed,
    SubOrderShipped,
    ShopProductCreated,
    NewDeviceLogin,
    SystemAlert
}
