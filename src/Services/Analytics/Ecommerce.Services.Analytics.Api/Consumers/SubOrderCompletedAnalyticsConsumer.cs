using System;
using System.Threading.Tasks;
using Ecommerce.Services.Analytics.Api.Models.Entities;
using Ecommerce.Services.Analytics.Api.Persistances;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Analytics.Api.Consumers;

public class SubOrderCompletedAnalyticsConsumer(
    AnalyticsDbContext dbContext,
    ILogger<SubOrderCompletedAnalyticsConsumer> logger)
    : IConsumer<SubOrderCompletedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderCompletedEvent> context)
    {
        var msg = context.Message;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        
        // Doanh thu thực nhận của Shop: ưu tiên lấy từ NetRevenue đã snapshot
        var commissionFee = msg.CommissionFee > 0 
            ? msg.CommissionFee 
            : (long)Math.Round(msg.TotalAmount * (msg.CommissionRate > 0 ? (msg.CommissionRate / 100m) : 0.05m), MidpointRounding.AwayFromZero);
        
        var actualShopRevenue = msg.NetRevenue > 0 
            ? msg.NetRevenue 
            : (msg.TotalAmount - commissionFee);

        var netPlatformRevenue = commissionFee - msg.PlatformDiscount;

        logger.LogInformation("Processing SubOrderCompletedEvent for SubOrderId: {SubOrderId}, ShopId: {ShopId}, Gross: {Gross}, Commission: {Commission}, NetShopRevenue: {NetShop}, NetPlatformRevenue: {NetPlatform}",
            msg.SubOrderId, msg.ShopId, msg.TotalAmount, commissionFee, actualShopRevenue, netPlatformRevenue);

        // 1. Update DailyShopRevenue
        var shopStat = await dbContext.DailyShopRevenues
            .FirstOrDefaultAsync(r => r.ShopId == msg.ShopId && r.Date == today, context.CancellationToken);

        if (shopStat == null)
        {
            dbContext.DailyShopRevenues.Add(new DailyShopRevenue
            {
                ShopId = msg.ShopId,
                Date = today,
                Revenue = actualShopRevenue,
                OrderCount = 1,
                CompletedOrderCount = 1,
                UpdatedDate = DateTimeOffset.UtcNow
            });
        }
        else
        {
            shopStat.Revenue += actualShopRevenue;
            shopStat.OrderCount += 1;
            shopStat.CompletedOrderCount += 1;
            shopStat.UpdatedDate = DateTimeOffset.UtcNow;
        }

        // 2. Update DailyPlatformRevenue
        var platformStat = await dbContext.DailyPlatformRevenues
            .FirstOrDefaultAsync(p => p.Date == today, context.CancellationToken);

        if (platformStat == null)
        {
            dbContext.DailyPlatformRevenues.Add(new DailyPlatformRevenue
            {
                Date = today,
                TotalGmv = msg.TotalAmount,
                PlatformRevenue = commissionFee,
                PlatformDiscountAmount = msg.PlatformDiscount,
                NetPlatformRevenue = netPlatformRevenue,
                TotalOrders = 1,
                TotalShippingFee = msg.ShippingFee,
                UpdatedDate = DateTimeOffset.UtcNow
            });
        }
        else
        {
            platformStat.TotalGmv += msg.TotalAmount;
            platformStat.PlatformRevenue += commissionFee;
            platformStat.PlatformDiscountAmount += msg.PlatformDiscount;
            platformStat.NetPlatformRevenue += netPlatformRevenue;
            platformStat.TotalOrders += 1;
            platformStat.TotalShippingFee += msg.ShippingFee;
            platformStat.UpdatedDate = DateTimeOffset.UtcNow;
        }

        // 3. Update ShopProductStats & DailyCategoryRevenue
        if (msg.Items != null && msg.Items.Count > 0)
        {
            var totalItemsSubTotal = msg.Items.Sum(x => (decimal)x.UnitPrice * x.Quantity);

            foreach (var item in msg.Items)
            {
                var prodStat = await dbContext.ShopProductStats
                    .FirstOrDefaultAsync(p => p.ShopId == msg.ShopId && p.ProductId == item.ProductId, context.CancellationToken);

                var itemSubTotal = (decimal)item.UnitPrice * item.Quantity;
                var itemRevenue = totalItemsSubTotal > 0
                    ? (long)Math.Round((itemSubTotal / totalItemsSubTotal) * actualShopRevenue, MidpointRounding.AwayFromZero)
                    : (actualShopRevenue / msg.Items.Count);

                if (prodStat == null)
                {
                    dbContext.ShopProductStats.Add(new ShopProductStats
                    {
                        ShopId = msg.ShopId,
                        ProductId = item.ProductId,
                        ProductName = !string.IsNullOrWhiteSpace(item.ProductName) ? item.ProductName : $"Sản phẩm #{item.ProductId}",
                        ThumbnailUrl = item.ThumbnailUrl,
                        ParentCategoryId = item.ParentCategoryId,
                        SoldQuantity = item.Quantity,
                        Revenue = itemRevenue,
                        UpdatedDate = DateTimeOffset.UtcNow
                    });
                }
                else
                {
                    prodStat.SoldQuantity += item.Quantity;
                    prodStat.Revenue += itemRevenue;
                    if (!string.IsNullOrWhiteSpace(item.ProductName))
                    {
                        prodStat.ProductName = item.ProductName;
                    }
                    if (!string.IsNullOrWhiteSpace(item.ThumbnailUrl))
                    {
                        prodStat.ThumbnailUrl = item.ThumbnailUrl;
                    }
                    if (item.ParentCategoryId.HasValue)
                    {
                        prodStat.ParentCategoryId = item.ParentCategoryId;
                    }
                    prodStat.UpdatedDate = DateTimeOffset.UtcNow;
                }

                // Cập nhật nhật ký doanh thu danh mục cha DailyCategoryRevenue (Chỉ theo Parent Category)
                var parentCatId = item.ParentCategoryId ?? 0;
                if (parentCatId > 0)
                {
                    var catStat = await dbContext.DailyCategoryRevenues
                        .FirstOrDefaultAsync(c => c.Date == today && c.ParentCategoryId == parentCatId, context.CancellationToken);

                    if (catStat == null)
                    {
                        dbContext.DailyCategoryRevenues.Add(new DailyCategoryRevenue
                        {
                            Date = today,
                            ParentCategoryId = parentCatId,
                            Revenue = itemRevenue,
                            SoldQuantity = item.Quantity,
                            UpdatedDate = DateTimeOffset.UtcNow
                        });
                    }
                    else
                    {
                        catStat.Revenue += itemRevenue;
                        catStat.SoldQuantity += item.Quantity;
                        catStat.UpdatedDate = DateTimeOffset.UtcNow;
                    }
                }
            }
        }

        await dbContext.SaveChangesAsync(context.CancellationToken);
        logger.LogInformation("Successfully updated analytics materialization for SubOrderId: {SubOrderId}", msg.SubOrderId);
    }
}
