namespace Ecommerce.Services.Payments.Api.Models.Enums;

public enum WithdrawalStatus
{
    Pending,      // Chờ Admin duyệt (tiền đã được hold)
    Approved,     // Admin đã duyệt và đang tiến hành chuyển khoản ngân hàng
    Completed,    // Admin xác nhận đã chuyển khoản thành công
    Rejected      // Admin từ chối (tiền được hoàn lại cho user)
}
