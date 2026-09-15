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

        // 1. Đếm tổng số shop duy nhất đã phát sinh dữ liệu
        var totalShops = await dbContext.DailyShopRevenues
            .AsNoTracking()
            .Select(r => r.ShopId)
            .Distinct()
            .CountAsync(cancellationToken);

        // 2. Gom toàn bộ các phép tính SUM và số đơn hôm nay vào 1 câu SQL duy nhất
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
                TotalShippingFee = g.Sum(r => (long?)r.TotalShippingFee) ?? 0,
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
            TotalShippingFee = platformStats?.TotalShippingFee ?? 0,
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

    public async Task<PaginatedProductsDto> GetTopProductsAsync(int page = 1, int pageSize = 15, long? parentCategoryId = null, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 30); // Tối đa 30 sản phẩm bán chạy nhất sàn

        var query = dbContext.ShopProductStats.AsNoTracking();
        if (parentCategoryId.HasValue && parentCategoryId.Value > 0)
        {
            query = query.Where(p => p.ParentCategoryId == parentCategoryId.Value);
        }

        var grouped = query
            .GroupBy(p => p.ProductId)
            .Select(g => new TopProductDto
            {
                ProductId = g.Key,
                Name = g.Max(x => x.ProductName) ?? string.Empty,
                ThumbnailUrl = g.Max(x => x.ThumbnailUrl),
                ParentCategoryId = g.Max(x => x.ParentCategoryId),
                SoldQuantity = g.Sum(x => x.SoldQuantity),
                Revenue = g.Sum(x => x.Revenue)
            });

        var totalCount = await grouped.CountAsync(cancellationToken);
        var items = await grouped
            .OrderByDescending(p => p.SoldQuantity)
            .ThenByDescending(p => p.Revenue)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // Đảm bảo luôn có tên sản phẩm hiển thị, không để trống
        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.Name))
            {
                item.Name = $"Sản phẩm #{item.ProductId}";
            }
        }

        return new PaginatedProductsDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<AdminCategoryDto>> GetCategoriesAsync(string period = "7d", int? year = null, int? month = null, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly startDate;
        DateOnly endDate = today;

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
                _ => 7
            };
            startDate = today.AddDays(-days + 1);
        }

        var query = dbContext.DailyCategoryRevenues
            .AsNoTracking()
            .Where(c => c.Date >= startDate && c.Date <= endDate && c.ParentCategoryId > 0);

        var catGroups = await query
            .GroupBy(c => c.ParentCategoryId)
            .Select(g => new
            {
                CategoryId = g.Key,
                Revenue = g.Sum(x => x.Revenue),
                SoldQuantity = g.Sum(x => x.SoldQuantity)
            })
            .ToListAsync(cancellationToken);

        // Nếu DailyCategoryRevenue chưa có dữ liệu, fallback sang nhóm theo ShopProductStats
        if (catGroups.Count == 0)
        {
            catGroups = await dbContext.ShopProductStats
                .AsNoTracking()
                .Where(p => p.ParentCategoryId.HasValue && p.ParentCategoryId.Value > 0)
                .GroupBy(p => p.ParentCategoryId!.Value)
                .Select(g => new
                {
                    CategoryId = g.Key,
                    Revenue = g.Sum(x => x.Revenue),
                    SoldQuantity = g.Sum(x => x.SoldQuantity)
                })
                .ToListAsync(cancellationToken);
        }

        var totalRevenue = catGroups.Sum(x => (double)x.Revenue);

        return catGroups
            .OrderByDescending(c => c.Revenue)
            .ThenByDescending(c => c.SoldQuantity)
            .Select(c => new AdminCategoryDto
            {
                CategoryId = c.CategoryId,
                Name = string.Empty, // Frontend tự động ánh xạ từ cache danh mục
                Revenue = c.Revenue,
                SoldQuantity = c.SoldQuantity,
                Percentage = totalRevenue > 0 ? Math.Round((double)c.Revenue / totalRevenue * 100, 1) : 0
            })
            .ToList();
    }

    public async Task<ProductDetailAnalyticsDto?> GetProductDetailAnalyticsAsync(long productId, string period = "7d", CancellationToken cancellationToken = default)
    {
        var productStats = await dbContext.ShopProductStats
            .AsNoTracking()
            .Where(p => p.ProductId == productId)
            .FirstOrDefaultAsync(cancellationToken);

        if (productStats == null)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var days = period.ToLower() switch
        {
            "today" or "1d" => 1,
            "3d" => 3,
            "week" or "7d" => 7,
            "month" or "30d" => 30,
            _ => 7
        };
        var startDate = today.AddDays(-days + 1);

        // Biểu đồ xu hướng sản phẩm
        var chartPoints = new List<RevenueChartPointDto>();
        var avgDailyRev = days > 0 ? productStats.Revenue / days : productStats.Revenue;
        var avgDailySold = days > 0 ? Math.Max(1, productStats.SoldQuantity / days) : productStats.SoldQuantity;

        for (var d = startDate; d <= today; d = d.AddDays(1))
        {
            chartPoints.Add(new RevenueChartPointDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                Revenue = avgDailyRev,
                OrderCount = avgDailySold
            });
        }

        return new ProductDetailAnalyticsDto
        {
            ProductId = productStats.ProductId,
            Name = productStats.ProductName,
            ThumbnailUrl = productStats.ThumbnailUrl,
            ParentCategoryId = productStats.ParentCategoryId,
            SoldQuantity = productStats.SoldQuantity,
            Revenue = productStats.Revenue,
            ShopId = productStats.ShopId,
            ChartData = chartPoints
        };
    }

    public async Task<PaginatedProductsDto> GetShopProductsAsync(long shopId, int page = 1, int pageSize = 15, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50); // Tối đa 50 sản phẩm/trang

        var query = dbContext.ShopProductStats
            .AsNoTracking()
            .Where(p => p.ShopId == shopId);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.SoldQuantity)
            .ThenByDescending(p => p.Revenue)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new TopProductDto
            {
                ProductId = p.ProductId,
                Name = !string.IsNullOrEmpty(p.ProductName) ? p.ProductName : $"Sản phẩm #{p.ProductId}",
                ThumbnailUrl = p.ThumbnailUrl,
                ParentCategoryId = p.ParentCategoryId,
                SoldQuantity = p.SoldQuantity,
                Revenue = p.Revenue
            })
            .ToListAsync(cancellationToken);

        return new PaginatedProductsDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
