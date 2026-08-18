namespace Ecommerce.Services.Orders.Application.Services;

/// <summary>
/// Repository chuyên biệt cho Voucher với các operation atomic (không qua entity tracking).
/// Đảm bảo không xảy ra race condition khi nhiều đơn hàng cùng dùng một voucher.
/// </summary>
public interface IVoucherRepository
{
    /// <summary>
    /// Tăng UsageCount lên 1 một cách atomic cho danh sách voucher.
    /// Chỉ thành công nếu toàn bộ các voucher trong danh sách đều còn lượt dùng (UsageCount < MaxUsageCount).
    /// </summary>
    /// <returns>true nếu toàn bộ danh sách tăng thành công, false nếu có ít nhất một voucher bị hết lượt hoặc không tồn tại.</returns>
    Task<bool> TryIncrementUsagesAsync(ICollection<Guid> voucherIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Giảm UsageCount xuống 1 một cách atomic khi hoàn lại voucher do hủy đơn.
    /// Đảm bảo không giảm xuống dưới 0.
    /// </summary>
    Task DecrementUsageAsync(Guid voucherId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Giảm UsageCount xuống 1 một cách atomic cho danh sách voucher trong 1 query duy nhất.
    /// Đảm bảo không giảm xuống dưới 0.
    /// </summary>
    Task DecrementUsagesAsync(ICollection<Guid> voucherIds, CancellationToken cancellationToken = default);
}
