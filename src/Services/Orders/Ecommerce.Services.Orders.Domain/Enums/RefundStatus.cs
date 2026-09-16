namespace Ecommerce.Services.Orders.Domain.Enums;

public enum RefundStatus
{
    Pending = 1,          // Chờ Người bán duyệt
    SellerApproved = 2,   // Người bán đồng ý hoàn tiền
    SellerRejected = 3,   // Người bán từ chối hoàn tiền
    Cancelled = 4         // Người mua hủy yêu cầu hoàn tiền
}
