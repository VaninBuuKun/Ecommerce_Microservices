using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Dtos;
using Ecommerce.Services.Analytics.Api.Models.Interfaces;
using Ecommerce.Services.Analytics.Api.Persistances;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Analytics.Api.Services;

public class SellerAnalyticsService(AnalyticsDbContext dbContext) : ISellerAnalyticsService
{
    public async Task<SellerOverviewDto> GetOverviewAsync(long shopId, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var firstDayOfMonth = new DateOnly(today.Year, today.Month, 1);

        // 1. Gom các thống kê hôm nay, tháng này và toàn thời gian vào 1 query duy nhất (1 await thay vì 3 awaits)
        var shopStats = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .Where(r => r.ShopId == shopId)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalOrders = g.Sum(r => (int?)r.OrderCount) ?? 0,
                MonthRevenue = g.Sum(r => r.Date >= firstDayOfMonth && r.Date <= today ? (long?)r.Revenue : 0) ?? 0,
                TodayRevenue = g.Sum(r => r.Date == today ? (long?)r.Revenue : 0) ?? 0,
                TodayOrders = g.Sum(r => r.Date == today ? (int?)r.OrderCount : 0) ?? 0
            })
            .FirstOrDefaultAsync(cancellationToken);

        // 2. Đếm số lượng sản phẩm của shop (1 await)
        var totalProducts = await dbContext.ShopProductStats
            .AsNoTracking()
            .CountAsync(p => p.ShopId == shopId, cancellationToken);

        return new SellerOverviewDto
        {
            TodayRevenue = shopStats?.TodayRevenue ?? 0,
            MonthRevenue = shopStats?.MonthRevenue ?? 0,
            TotalOrders = shopStats?.TotalOrders ?? 0,
            TodayOrders = shopStats?.TodayOrders ?? 0,
            PendingOrders = 0,
            TotalProducts = totalProducts,
            AverageRating = 5.0,
            TotalFollowers = 0
        };
    }

    public async Task<List<RevenueChartPointDto>> GetRevenueChartAsync(long shopId, string period = "7d", int? year = null, int? month = null, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Case 1: Filter theo năm (12 tháng)
        if (year.HasValue && !month.HasValue)
        {
            var y = year.Value;
            var startOfYear = new DateOnly(y, 1, 1);
            var endOfYear = new DateOnly(y, 12, 31);
            if (endOfYear > today) endOfYear = today;

            var yearRecords = await dbContext.DailyShopRevenues
                .AsNoTracking()
                .Where(r => r.ShopId == shopId && r.Date >= startOfYear && r.Date <= endOfYear)
                .ToListAsync(cancellationToken);

            var maxMonth = y == today.Year ? today.Month : 12;
            var resultYear = new List<RevenueChartPointDto>();
            for (var m = 1; m <= maxMonth; m++)
            {
                var monthStats = yearRecords.Where(r => r.Date.Month == m).ToList();
                resultYear.Add(new RevenueChartPointDto
                {
                    Date = $"{y}-{m:D2}",
                    Revenue = monthStats.Sum(s => s.Revenue),
                    OrderCount = monthStats.Sum(s => s.OrderCount)
                });
            }
            return resultYear;
        }

        // Case 2: Filter theo tháng cụ thể hoặc theo kỳ period
        DateOnly startDate;
        DateOnly endDate;
        if (year.HasValue && month.HasValue)
        {
            var y = year.Value;
            var m = month.Value;
            var daysInMonth = DateTime.DaysInMonth(y, m);
            startDate = new DateOnly(y, m, 1);
            endDate = new DateOnly(y, m, daysInMonth);
            if (endDate > today) endDate = today;
        }
        else
        {
            var days = period.ToLower() switch
            {
                "today" or "1d" => 1,
                "3d" => 3,
                "week" or "7d" => 7,
                "month" or "30d" => 30,
                "90d" => 90,
                "year" or "365d" or "1y" => 365,
                _ => 7
            };
            startDate = today.AddDays(-days + 1);
            endDate = today;
        }

        var records = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .Where(r => r.ShopId == shopId && r.Date >= startDate && r.Date <= endDate)
            .ToDictionaryAsync(r => r.Date, cancellationToken);

        var result = new List<RevenueChartPointDto>();
        for (var d = startDate; d <= endDate; d = d.AddDays(1))
        {
            if (records.TryGetValue(d, out var stat))
            {
                result.Add(new RevenueChartPointDto
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    Revenue = stat.Revenue,
                    OrderCount = stat.OrderCount
                });
            }
            else
            {
                result.Add(new RevenueChartPointDto
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    Revenue = 0,
                    OrderCount = 0
                });
            }
        }

        return result;
    }

    public async Task<List<TopProductDto>> GetTopProductsAsync(long shopId, int limit = 10, CancellationToken cancellationToken = default)
    {
        var items = await dbContext.ShopProductStats
            .AsNoTracking()
            .Where(p => p.ShopId == shopId)
            .OrderByDescending(p => p.SoldQuantity)
            .Take(limit)
            .Select(p => new TopProductDto
            {
                ProductId = p.ProductId,
                Name = !string.IsNullOrEmpty(p.ProductName) ? p.ProductName : $"Sản phẩm #{p.ProductId}",
                ThumbnailUrl = p.ThumbnailUrl,
                SoldQuantity = p.SoldQuantity,
                Revenue = p.Revenue
            })
            .ToListAsync(cancellationToken);

        return items;
    }
}
