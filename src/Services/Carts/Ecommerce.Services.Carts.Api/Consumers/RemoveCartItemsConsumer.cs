using System;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.Consumers;

public class RemoveCartItemsConsumer(ICacheService cacheService, ILogger<RemoveCartItemsConsumer> logger) : IConsumer<RemoveCartItemsRequest>
{
    private static readonly TimeSpan CartExpiry = TimeSpan.FromDays(7);

    public async Task Consume(ConsumeContext<RemoveCartItemsRequest> context)
    {
        var customerId = context.Message.CustomerId;
        var variantIds = context.Message.VariantIds;
        
        logger.LogInformation("Nhận RemoveCartItemsCommand cho khách hàng {CustomerId}. Số sản phẩm cần xóa: {Count}", customerId, variantIds.Count);
        
        try
        {
            var key = CartCacheKey.GetCartCacheKey(customerId);
            var cart = await cacheService.GetAsync<Cart>(key, context.CancellationToken);

            if (cart is null)
            {
                logger.LogWarning("Không tìm thấy giỏ hàng cho khách hàng {CustomerId} để xóa các sản phẩm.", customerId);
                return;
            }

            // Xóa các sản phẩm được chỉ định
            int removedCount = cart.Items.RemoveAll(x => variantIds.Contains(x.ProductVariantId));

            await cacheService.SetAsync(key, cart, CartExpiry, context.CancellationToken);

            logger.LogInformation("Đã xóa {Count} sản phẩm khỏi giỏ hàng của khách hàng {CustomerId}.", removedCount, customerId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi xóa các sản phẩm khỏi giỏ hàng của khách hàng {CustomerId}: {Message}", customerId, ex.Message);
        }
    }
}
