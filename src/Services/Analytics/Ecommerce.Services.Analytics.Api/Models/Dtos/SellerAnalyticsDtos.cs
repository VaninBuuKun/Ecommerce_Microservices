using System.Collections.Generic;
using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Analytics.Api.Models.Dtos;

public class SellerOverviewDto
{
    public long TodayRevenue { get; set; }
    public long MonthRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TodayOrders { get; set; }
    public int PendingOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int RefundedOrders { get; set; }
    public long RefundAmount { get; set; }
    public int TotalProducts { get; set; }
    public double AverageRating { get; set; }
    public int TotalFollowers { get; set; }
}

public class RevenueChartPointDto
{
    public string Date { get; set; } = string.Empty;
    public long Revenue { get; set; }
    public int OrderCount { get; set; }
}

public class TopProductDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public long? ParentCategoryId { get; set; }
    public int SoldQuantity { get; set; }
    public long Revenue { get; set; }
}
