using System.Collections.Generic;

namespace Ecommerce.Services.Analytics.Api.Models.Dtos;

public class AdminOverviewDto
{
    public int TotalShops { get; set; }
    public int TotalOrders { get; set; }
    /// <summary>Doanh thu hoa hồng sàn (Gross)</summary>
    public long PlatformRevenue { get; set; }
    /// <summary>Tổng giá trị giao dịch GMV toàn sàn</summary>
    public long TotalGmv { get; set; }
    /// <summary>Doanh thu thuần của sàn sau voucher</summary>
    public long NetPlatformRevenue { get; set; }
    /// <summary>Chi phí voucher do sàn trợ giá</summary>
    public long PlatformDiscountAmount { get; set; }
    public int TodayNewOrders { get; set; }
}

public class AdminRevenueChartDto
{
    public string Date { get; set; } = string.Empty;
    public long Revenue { get; set; } // Platform commission
    public long Gmv { get; set; }
    public long NetRevenue { get; set; }
    public int OrderCount { get; set; }
}
