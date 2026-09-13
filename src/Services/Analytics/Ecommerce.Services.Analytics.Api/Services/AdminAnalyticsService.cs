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

public class AdminAnalyticsService(AnalyticsDbContext dbContext) : IAdminAnalyticsService
{
    public async Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Đếm tổng số shop duy nhất đã phát sinh dữ liệu (1 await)
        var totalShops = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .Select(r => r.ShopId)
            .Distinct()
            .CountAsync(cancellationToken);

        // 2. Gom toàn bộ 5 phép tính SUM và số đơn hôm nay vào 1 câu SQL duy nhất (1 await thay vì 6 awaits)
        var platformStats = await dbContext.DailyPlatformRevenues
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalOrders = g.Sum(r => (int?)r.TotalOrders) ?? 0,
                PlatformRevenue = g.Sum(r => (long?)r.PlatformRevenue) ?? 0,
                TotalGmv = g.Sum(r => (long?)r.TotalGmv) ?? 0,
                NetPlatformRevenue = g.Sum(r => (long?)r.NetPlatformRevenue) ?? 0,
                PlatformDiscountAmount = g.Sum(r => (long?)r.PlatformDiscountAmount) ?? 0,
                TodayNewOrders = g.Sum(r => r.Date == today ? (int?)r.TotalOrders : 0) ?? 0
            })
            .FirstOrDefaultAsync(cancellationToken);

        return new AdminOverviewDto
        {
            TotalShops = totalShops,
            TotalOrders = platformStats?.TotalOrders ?? 0,
            PlatformRevenue = platformStats?.PlatformRevenue ?? 0,
            TotalGmv = platformStats?.TotalGmv ?? 0,
            NetPlatformRevenue = platformStats?.NetPlatformRevenue ?? 0,
            PlatformDiscountAmount = platformStats?.PlatformDiscountAmount ?? 0,
            TodayNewOrders = platformStats?.TodayNewOrders ?? 0
        };
    }

    public async Task<List<AdminRevenueChartDto>> GetRevenueChartAsync(string period = "7d", int? year = null, int? month = null, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Case 1: Filter theo năm (12 tháng)
        if (year.HasValue && !month.HasValue)
        {
            var y = year.Value;
            var startOfYear = new DateOnly(y, 1, 1);
            var endOfYear = new DateOnly(y, 12, 31);
            if (endOfYear > today) endOfYear = today;

            var yearRecords = await dbContext.DailyPlatformRevenues
                .AsNoTracking()
                .Where(r => r.Date >= startOfYear && r.Date <= endOfYear)
                .ToListAsync(cancellationToken);

            var maxMonth = y == today.Year ? today.Month : 12;
            var resultYear = new List<AdminRevenueChartDto>();
            for (var m = 1; m <= maxMonth; m++)
            {
                var monthStats = yearRecords.Where(r => r.Date.Month == m).ToList();
                resultYear.Add(new AdminRevenueChartDto
                {
                    Date = $"{y}-{m:D2}",
                    Revenue = monthStats.Sum(s => s.PlatformRevenue),
                    Gmv = monthStats.Sum(s => s.TotalGmv),
                    NetRevenue = monthStats.Sum(s => s.NetPlatformRevenue),
                    OrderCount = monthStats.Sum(s => s.TotalOrders)
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

        var records = await dbContext.DailyPlatformRevenues
            .AsNoTracking()
            .Where(r => r.Date >= startDate && r.Date <= endDate)
            .ToDictionaryAsync(r => r.Date, cancellationToken);

        var result = new List<AdminRevenueChartDto>();
        for (var d = startDate; d <= endDate; d = d.AddDays(1))
        {
            if (records.TryGetValue(d, out var stat))
            {
                result.Add(new AdminRevenueChartDto
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    Revenue = stat.PlatformRevenue,
                    Gmv = stat.TotalGmv,
                    NetRevenue = stat.NetPlatformRevenue,
                    OrderCount = stat.TotalOrders
                });
            }
            else
            {
                result.Add(new AdminRevenueChartDto
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    Revenue = 0,
                    Gmv = 0,
                    NetRevenue = 0,
                    OrderCount = 0
                });
            }
        }

        return result;
    }

    public async Task<List<TopProductDto>> GetTopProductsAsync(int limit = 10, CancellationToken cancellationToken = default)
    {
        var items = await dbContext.ShopProductStats
            .AsNoTracking()
            .GroupBy(p => p.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                ProductName = g.Max(x => x.ProductName),
                ThumbnailUrl = g.Max(x => x.ThumbnailUrl),
                SoldQuantity = g.Sum(x => x.SoldQuantity),
                Revenue = g.Sum(x => x.Revenue)
            })
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
