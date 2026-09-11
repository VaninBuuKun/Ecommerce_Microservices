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

        var todayStat = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.ShopId == shopId && r.Date == today, cancellationToken);

        var monthRevenue = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .Where(r => r.ShopId == shopId && r.Date >= firstDayOfMonth && r.Date <= today)
            .SumAsync(r => (long?)r.Revenue, cancellationToken) ?? 0;

        var totalOrders = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .Where(r => r.ShopId == shopId)
            .SumAsync(r => (int?)r.OrderCount, cancellationToken) ?? 0;

        var totalProducts = await dbContext.ShopProductStats
            .AsNoTracking()
            .CountAsync(p => p.ShopId == shopId, cancellationToken);

        return new SellerOverviewDto
        {
            TodayRevenue = todayStat?.Revenue ?? 0,
            MonthRevenue = monthRevenue,
            TotalOrders = totalOrders,
            TodayOrders = todayStat?.OrderCount ?? 0,
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
