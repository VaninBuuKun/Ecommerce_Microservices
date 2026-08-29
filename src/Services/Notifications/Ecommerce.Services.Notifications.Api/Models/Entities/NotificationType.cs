namespace Ecommerce.Services.Notifications.Api.Models.Entities;

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
