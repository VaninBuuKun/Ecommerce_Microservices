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
            TotalProducts = totalProducts > 0 ? totalProducts : 1,
            AverageRating = 4.8,
            TotalFollowers = 120
        };
    }

    public async Task<List<RevenueChartPointDto>> GetRevenueChartAsync(long shopId, string period = "7d", CancellationToken cancellationToken = default)
    {
        var days = period.ToLower() switch
        {
            "30d" => 30,
            "90d" => 90,
            _ => 7
        };

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var startDate = today.AddDays(-days + 1);

        var records = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .Where(r => r.ShopId == shopId && r.Date >= startDate && r.Date <= today)
            .ToDictionaryAsync(r => r.Date, cancellationToken);

        var result = new List<RevenueChartPointDto>();
        for (var d = startDate; d <= today; d = d.AddDays(1))
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
                Name = $"Sản phẩm #{p.ProductId}",
                SoldQuantity = p.SoldQuantity,
                Revenue = p.Revenue
            })
            .ToListAsync(cancellationToken);

        return items;
    }
}
