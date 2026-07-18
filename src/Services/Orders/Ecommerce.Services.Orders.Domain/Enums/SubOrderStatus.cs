namespace Ecommerce.Services.Orders.Domain.Enums;

public enum SubOrderStatus
{
    AwaitingPayment,
    AwaitingConfirmation,
    Processing, //Hiễn thị là đã chấp nhận và đang xử lý
    Shipping, //Đang giao khi hoàn tất đóng gói đưa cho bên giao hàng
    Delivered, //Khi shipper giao hàng 
    Completed, //Khi khách hàng xác nhận đã nhận hàng và hài lòng (Trong 7 ngày sau delivered) tiền sẽ về ví của shop.
    Cancelled
}