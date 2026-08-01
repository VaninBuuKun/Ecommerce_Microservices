namespace Ecommerce.Services.Payments.Api.Models.Enums;

public enum TransactionReason
{
    OrderRefund,        // Hoàn tiền đơn hàng (Credit ví Customer)
    SellerRevenue,      // Doanh thu đơn hàng hoàn tất (Credit ví Seller)
    WithdrawalHold,     // Giữ tiền để rút (Debit từ ví)
    WithdrawalReject,   // Trả lại tiền do rút bị từ chối (Credit ví)
    RefundRejection     // Hoàn tiền khi đơn online bị Seller reject trước giao hàng (Credit ví Customer)
}
