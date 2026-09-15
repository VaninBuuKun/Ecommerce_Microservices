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
    /// <summary>Tổng phí vận chuyển đối soát cần thanh toán cho bên thứ 3 (GHN)</summary>
    public long TotalShippingFee { get; set; }
}

public class AdminRevenueChartDto
{
    public string Date { get; set; } = string.Empty;
    public long Revenue { get; set; } // Platform commission
    public long Gmv { get; set; }
    public long NetRevenue { get; set; }
    public int OrderCount { get; set; }
}

public class AdminCategoryDto
{
    public long CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long Revenue { get; set; }
    public int SoldQuantity { get; set; }
    public double Percentage { get; set; }
}

public class ProductDetailAnalyticsDto
{
    public long ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public long? ParentCategoryId { get; set; }
    public int SoldQuantity { get; set; }
    public long Revenue { get; set; }
    public long ShopId { get; set; }
    public List<RevenueChartPointDto> ChartData { get; set; } = new();
}

public class PaginatedProductsDto
{
    public List<TopProductDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)System.Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 15));
}
