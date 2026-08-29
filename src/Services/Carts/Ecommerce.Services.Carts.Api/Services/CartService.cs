using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Carts.Api.Models.Dtos;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.Services;

public class CartService(
    ICacheService cacheService,
    IProductService productService,
    ISellerService sellerService,
    IMapper mapper,
    ILogger<CartService> logger) : ICartService
{
    public async Task<Result<CartResponse>> GetCartAsync(long customerId, CancellationToken cancellationToken = default)
    {
        try
        {
            var cart = await cacheService.GetAsync<Cart>(
                CartCacheKey.GetCartCacheKey(customerId), 
                cancellationToken);

            if (cart == null)
            {
                cart = new Cart(customerId);
                await cacheService.SetAsync(
                    CartCacheKey.GetCartCacheKey(customerId),
                    cart,
                    TimeSpan.FromDays(7),
                    cancellationToken);
            }

            if (cart.Items.Count == 0)
            {
                return Result<CartResponse>.Success(new CartResponse
                {
                    CustomerId = customerId,
                    ShopGroups = []
                });
            }

            var variantIds = cart.Items
                .Where(i => i.ProductVariantId.HasValue && i.ProductVariantId.Value != 0)
                .Select(i => i.ProductVariantId!.Value)
                .ToList();
            var productIds = cart.Items
                .Where(i => i.ProductId != 0)
                .Select(i => i.ProductId)
                .ToList();

            var listProductResult = await productService.GetProductVariantListAsync(variantIds, productIds);
            
            if (!listProductResult.IsSuccess)
            {
                return Result<CartResponse>.Failure(listProductResult.Message ?? "Lỗi khi lấy thông tin sản phẩm", listProductResult.ErrorCode);
            }

            var listProductDto = listProductResult.Value;
            var productDist = new Dictionary<long, Models.Dtos.ProductDto>();
            foreach (var p in listProductDto)
            {
                if (p.VariantId != 0) productDist[p.VariantId] = p;
                if (p.ProductId != 0) productDist[p.ProductId] = p;
            }
            
            var flatItems = mapper.Map<List<CartItemResponse>>(cart.Items);
            foreach (var item in flatItems)
            {
                var lookupKey = (item.ProductVariantId != 0 && productDist.ContainsKey(item.ProductVariantId)) 
                    ? item.ProductVariantId 
                    : item.ProductId;
                if (productDist.TryGetValue(lookupKey, out var productInfo))
                {
                    item.ProductName = productInfo.ProductName;
                    item.VariantName = productInfo.VariantName;
                    item.UnitPrice = productInfo.UnitPrice;
                    item.DiscountPrice = productInfo.DiscountPrice;
                    item.AvailableStocks = (int)productInfo.AvailableStocks;
                    item.ShopId = productInfo.ShopId;
                    item.ThumbnailUrl = productInfo.ThumbnailUrl;
                }
            }

            var shopIds = flatItems.Select(i => i.ShopId).Distinct().ToList();
            var shopNamesResult = await sellerService.GetShopNamesAsync(shopIds);
            var shopNamesDict = shopNamesResult.IsSuccess ? shopNamesResult.Value : new Dictionary<long, string>();

            var shopGroups = flatItems
                .GroupBy(i => i.ShopId)
                .Select(g => new ShopCartGroupResponse
                {
                    ShopId = g.Key,
                    ShopName = shopNamesDict.TryGetValue(g.Key, out var name) ? name : $"Cửa hàng #{g.Key}",
                    Items = g.ToList()
                })
                .ToList();

            return Result<CartResponse>.Success(new CartResponse
            {
                CustomerId = customerId,
                ShopGroups = shopGroups
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy giỏ hàng của {CustomerId}: {Message}", customerId, ex.Message);
            return Result<CartResponse>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<CartResponse>> AddItemToCartAsync(long customerId, AddItemToCartRequest request, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken) 
                   ?? new Cart(customerId);

        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId && i.ProductVariantId == request.ProductVariantId);
        if (existingItem != null)
        {
            existingItem.Quantity += request.Quantity;
            existingItem.IsSelected = request.IsSelected;
        }
        else
        {
            cart.Items.Add(new CartItem { ProductId = request.ProductId, ProductVariantId = request.ProductVariantId, Quantity = request.Quantity, IsSelected = request.IsSelected });
        }

        await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result<CartResponse>> UpdateQuantityAsync(long customerId, UpdateQuantityRequest request, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result<CartResponse>.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);

        var item = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId && i.ProductVariantId == request.ProductVariantId);
        if (item == null) return Result<CartResponse>.Failure("Sản phẩm không có trong giỏ hàng", EErrorCode.NotFound);

        if (request.Quantity <= 0)
        {
            cart.Items.Remove(item);
        }
        else
        {
            item.Quantity = request.Quantity;
        }

        await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result<CartResponse>> UpdateSelectStateAsync(long customerId, CartSelectStateRequest request, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result<CartResponse>.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);

        var item = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId && i.ProductVariantId == request.ProductVariantId);
        if (item == null) return Result<CartResponse>.Failure("Sản phẩm không có trong giỏ hàng", EErrorCode.NotFound);

        item.IsSelected = request.IsSelected;
        await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result<CartResponse>> RemoveItemFromCartAsync(long customerId, long productId, long productVariantId, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result<CartResponse>.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);

        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId && i.ProductVariantId == productVariantId);
        if (item != null)
        {
            cart.Items.Remove(item);
            await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        }

        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result> ClearCartAsync(long customerId, List<long>? variantIds = null, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result.Success();

        if (variantIds != null && variantIds.Count > 0)
        {
            cart.Items.RemoveAll(i => i.ProductVariantId.HasValue && variantIds.Contains(i.ProductVariantId.Value));
            await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        }
        else
        {
            await cacheService.RemoveAsync(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        }

        return Result.Success();
    }
}
