namespace Ecommerce.Services.Orders.Domain.Enums;

public enum RefundStatus
{
    Pending,   // Chờ Seller duyệt
    Approved,  // Seller đã đồng ý và hoàn tiền vào ví Customer
    Rejected,  // Seller từ chối yêu cầu
    AutoApproved // Tự động duyệt hoàn tiền khi đơn bị hủy trước khi giao
}
