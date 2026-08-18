using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.Repositories;

/// <summary>
/// Repository atomic cho Voucher — tăng/giảm UsageCount bằng ExecuteUpdateAsync
/// để tránh race condition khi nhiều đơn hàng cùng dùng một voucher.
/// Không dùng entity tracking nên không bị ảnh hưởng bởi Unit of Work.
/// </summary>
public class VoucherRepository(
    OrderDbContext dbContext,
    ILogger<VoucherRepository> logger) : IVoucherRepository
{
    /// <summary>
    /// Tăng UsageCount lên 1 cho toàn bộ danh sách voucher trong 1 câu SQL duy nhất.
    /// Trả về true nếu số lượng dòng được update bằng đúng số lượng voucher truyền vào.
    /// </summary>
    public async Task<bool> TryIncrementUsagesAsync(ICollection<Guid> voucherIds, CancellationToken cancellationToken = default)
    {
        if (voucherIds == null || voucherIds.Count == 0)
            return true;

        var uniqueIds = voucherIds.Distinct().ToList();

        var affected = await dbContext.Vouchers
            .Where(v => uniqueIds.Contains(v.Id) && v.UsageCount < v.MaxUsageCount)
            .ExecuteUpdateAsync(
                s => s.SetProperty(v => v.UsageCount, v => v.UsageCount + 1),
                cancellationToken);

        if (affected != uniqueIds.Count)
        {
            logger.LogWarning("TryIncrementUsages: Chỉ cập nhật được {Affected}/{Total} voucher. Có voucher đã hết lượt sử dụng.", affected, uniqueIds.Count);
            return false;
        }

        return true;
    }

    /// <summary>
    /// Giảm UsageCount xuống 1 khi hoàn lại voucher do hủy đơn.
    /// Đảm bảo không giảm xuống dưới 0.
    /// </summary>
    public async Task DecrementUsageAsync(Guid voucherId, CancellationToken cancellationToken = default)
    {
        var affected = await dbContext.Vouchers
            .Where(v => v.Id == voucherId && v.UsageCount > 0)
            .ExecuteUpdateAsync(
                s => s.SetProperty(v => v.UsageCount, v => v.UsageCount - 1),
                cancellationToken);

        if (affected == 0)
        {
            logger.LogWarning("DecrementUsage: Voucher {VoucherId} không tìm thấy hoặc UsageCount đã là 0.", voucherId);
        }
        else
        {
            logger.LogInformation("DecrementUsage: Hoàn lại lượt dùng cho Voucher {VoucherId}.", voucherId);
        }
    }

    /// <summary>
    /// Giảm UsageCount xuống 1 cho danh sách voucher trong 1 câu SQL duy nhất.
    /// Đảm bảo không giảm xuống dưới 0.
    /// </summary>
    public async Task DecrementUsagesAsync(ICollection<Guid> voucherIds, CancellationToken cancellationToken = default)
    {
        if (voucherIds == null || voucherIds.Count == 0) return;

        var uniqueIds = voucherIds.Distinct().ToList();

        var affected = await dbContext.Vouchers
            .Where(v => uniqueIds.Contains(v.Id) && v.UsageCount > 0)
            .ExecuteUpdateAsync(
                s => s.SetProperty(v => v.UsageCount, v => v.UsageCount - 1),
                cancellationToken);

        logger.LogInformation("DecrementUsages: Đã hoàn lại lượt dùng cho {Affected}/{Total} voucher.", affected, uniqueIds.Count);
    }
}
