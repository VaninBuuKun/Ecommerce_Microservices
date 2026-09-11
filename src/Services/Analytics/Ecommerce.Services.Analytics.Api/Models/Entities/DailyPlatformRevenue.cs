using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Analytics.Api.Models.Entities;

public class DailyPlatformRevenue : EntityBase<long>
{
    public DateOnly Date { get; set; }
    /// <summary>Tổng giá trị giao dịch GMV toàn sàn (VND)</summary>
    public long TotalGmv { get; set; }
    /// <summary>Doanh thu hoa hồng sàn thu được từ các đơn hàng (VND)</summary>
    public long PlatformRevenue { get; set; }
    /// <summary>Chi phí sàn tự bỏ ra trợ giá cho người mua (Platform Discount) (VND)</summary>
    public long PlatformDiscountAmount { get; set; }
    /// <summary>Doanh thu thuần của sàn = PlatformRevenue - PlatformDiscountAmount (VND)</summary>
    public long NetPlatformRevenue { get; set; }
    /// <summary>Tổng số đơn hoàn tất</summary>
    public int TotalOrders { get; set; }
    public DateTimeOffset UpdatedDate { get; set; } = DateTimeOffset.UtcNow;
}
