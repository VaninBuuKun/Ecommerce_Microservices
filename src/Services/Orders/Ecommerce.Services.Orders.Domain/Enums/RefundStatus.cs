namespace Ecommerce.Services.Orders.Domain.Enums;

public enum RefundStatus
{
    Pending = 1,              // Chờ Seller duyệt
    Updating = 2,             // Người mua đang chỉnh sửa đơn (được phép sửa trước khi Seller duyệt hoặc nộp lại)
    SellerApproved = 3,       // Seller đồng ý hoàn tiền -> Tiến hành refund
    SellerRejected = 4,       // Seller từ chối -> Khách có thể nộp lại (tối đa 3 lần) hoặc Escalate lên Admin
    EscalatedToDispute = 5,   // Đã chuyển lên phòng khiếu nại Admin (Dispute Window 48h)
    AdminApproved = 6,        // Admin quyết định chấp thuận hoàn tiền
    AdminRejected = 7,        // Admin bác đơn khiếu nại
    Cancelled = 8,            // Khách hàng tự hủy yêu cầu hoàn trả
    Completed = 9,            // Đã hoàn tiền thành công vào Ví/Thẻ
    AutoApproved = 10         // Tự động duyệt hoàn tiền khi đơn bị hủy trước khi giao
}
