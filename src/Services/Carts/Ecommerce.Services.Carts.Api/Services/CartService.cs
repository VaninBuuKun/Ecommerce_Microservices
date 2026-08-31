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
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.Services;

public class CartService(
    ICacheService cacheService,
    IProductService productService,
    ISellerService sellerService,
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
                return Result<CartResponse>.Failure(listProductResult.Message ?? "Lỗi khi kết nối thông tin sản phẩm", listProductResult.ErrorCode);
            }

            var listProductDto = listProductResult.Value ?? new List<ProductDto>();
            var productDist = new Dictionary<long, ProductDto>();
            foreach (var p in listProductDto)
            {
                if (p.VariantId != 0) productDist[p.VariantId] = p;
                if (p.ProductId != 0) productDist[p.ProductId] = p;
            }
            
            var validItems = new List<CartItem>();
            var validItemResponses = new List<CartItemResponse>();
            bool hasModifiedCart = false;

            foreach (var cartItem in cart.Items)
            {
                var lookupKey = (cartItem.ProductVariantId.HasValue && cartItem.ProductVariantId.Value != 0 && productDist.ContainsKey(cartItem.ProductVariantId.Value)) 
                    ? cartItem.ProductVariantId.Value 
                    : cartItem.ProductId;

                if (productDist.TryGetValue(lookupKey, out var productInfo))
                {
                    int availableStock = (int)productInfo.AvailableStocks;

                    // Yêu cầu: Nếu số lượng hiện tại vượt quá tồn kho khả dụng thì gán về bằng số lượng tồn kho hiện tại
                    if (availableStock > 0 && cartItem.Quantity > availableStock)
                    {
                        cartItem.Quantity = availableStock;
                        hasModifiedCart = true;
                    }

                    // Đồng bộ lại ProductId và ProductVariantId chính xác từ Catalog
                    if (productInfo.ProductId != 0 && cartItem.ProductId != productInfo.ProductId)
                    {
                        cartItem.ProductId = productInfo.ProductId;
                        hasModifiedCart = true;
                    }

                    validItems.Add(cartItem);

                    validItemResponses.Add(new CartItemResponse
                    {
                        ProductId = productInfo.ProductId != 0 ? productInfo.ProductId : cartItem.ProductId,
                        ProductVariantId = cartItem.ProductVariantId ?? productInfo.VariantId,
                        Quantity = cartItem.Quantity,
                        IsSelected = cartItem.IsSelected,
                        ProductName = productInfo.ProductName,
                        VariantName = productInfo.VariantName,
                        UnitPrice = productInfo.UnitPrice,
                        DiscountPrice = productInfo.DiscountPrice,
                        AvailableStocks = availableStock,
                        ShopId = productInfo.ShopId,
                        ThumbnailUrl = productInfo.ThumbnailUrl
                    });
                }
                else
                {
                    // Sản phẩm đã bị xóa hoặc không còn tồn tại trong DB Catalog -> Tự động loại bỏ khỏi Redis
                    hasModifiedCart = true;
                    logger.LogInformation("Tự động dọn dẹp sản phẩm không tồn tại khỏi giỏ hàng user {CustomerId}: VariantId={VariantId}, ProductId={ProductId}",
                        customerId, cartItem.ProductVariantId, cartItem.ProductId);
                }
            }

            // Cập nhật lại Redis Cache nếu có dọn dẹp hoặc điều chỉnh số lượng tồn kho
            if (hasModifiedCart)
            {
                cart.Items = validItems;
                await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
            }

            if (validItemResponses.Count == 0)
            {
                return Result<CartResponse>.Success(new CartResponse
                {
                    CustomerId = customerId,
                    ShopGroups = []
                });
            }

            var shopIds = validItemResponses.Select(i => i.ShopId).Where(s => s > 0).Distinct().ToList();
            var shopNamesResult = await sellerService.GetShopNamesAsync(shopIds);
            var shopNamesDict = shopNamesResult.IsSuccess ? shopNamesResult.Value : new Dictionary<long, string>();

            var shopGroups = validItemResponses
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
        if (request.Quantity <= 0)
        {
            return Result<CartResponse>.Failure("Số lượng sản phẩm phải lớn hơn 0", EErrorCode.ValidationErrors);
        }

        // Gọi gRPC sang Catalog để xác thực sản phẩm & kiểm tra tồn kho trước khi lưu
        long lookupId = request.ProductVariantId > 0 
            ? request.ProductVariantId 
            : request.ProductId;

        var productResult = await productService.GetProductVariantAsync(lookupId);
        if (!productResult.IsSuccess || productResult.Value == null)
        {
            return Result<CartResponse>.Failure(productResult.Message ?? "Không tìm thấy sản phẩm hoặc biến thể này trong hệ thống.", EErrorCode.NotFound);
        }

        var productInfo = productResult.Value;
        int availableStock = (int)productInfo.AvailableStocks;

        if (availableStock <= 0)
        {
            return Result<CartResponse>.Failure("Sản phẩm này hiện tại đã hết hàng.", EErrorCode.ValidationErrors);
        }

        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken) 
                   ?? new Cart(customerId);

        long actualProductId = productInfo.ProductId != 0 ? productInfo.ProductId : request.ProductId;
        long actualVariantId = productInfo.VariantId != 0 ? productInfo.VariantId : request.ProductVariantId;

        var existingItem = cart.Items.FirstOrDefault(i => 
            (actualVariantId != 0 && i.ProductVariantId.HasValue && i.ProductVariantId.Value == actualVariantId) ||
            (actualVariantId == 0 && i.ProductId == actualProductId));

        if (existingItem != null)
        {
            int newQuantity = existingItem.Quantity + request.Quantity;
            if (newQuantity > availableStock)
            {
                // Nếu vượt quá tồn kho thì giới hạn lại bằng tồn kho khả dụng
                existingItem.Quantity = availableStock;
            }
            else
            {
                existingItem.Quantity = newQuantity;
            }
            existingItem.IsSelected = request.IsSelected;
        }
        else
        {
            int initQuantity = request.Quantity > availableStock ? availableStock : request.Quantity;
            cart.Items.Add(new CartItem 
            { 
                ProductId = actualProductId, 
                ProductVariantId = actualVariantId != 0 ? actualVariantId : null, 
                Quantity = initQuantity, 
                IsSelected = request.IsSelected 
            });
        }

        await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result<CartResponse>> UpdateQuantityAsync(long customerId, UpdateQuantityRequest request, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result<CartResponse>.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);

        var item = cart.Items.FirstOrDefault(i => 
            (request.ProductVariantId != 0 && i.ProductVariantId.HasValue && i.ProductVariantId.Value == request.ProductVariantId) ||
            (request.ProductVariantId == 0 && i.ProductId == request.ProductId));

        if (item == null) return Result<CartResponse>.Failure("Sản phẩm không có trong giỏ hàng", EErrorCode.NotFound);

        if (request.Quantity <= 0)
        {
            cart.Items.Remove(item);
        }
        else
        {
            // Kiểm tra tồn kho khả dụng qua gRPC
            long lookupId = item.ProductVariantId.HasValue && item.ProductVariantId.Value != 0 
                ? item.ProductVariantId.Value 
                : item.ProductId;

            var productResult = await productService.GetProductVariantAsync(lookupId);
            if (productResult.IsSuccess && productResult.Value != null)
            {
                int availableStock = (int)productResult.Value.AvailableStocks;
                item.Quantity = request.Quantity > availableStock && availableStock > 0 ? availableStock : request.Quantity;
            }
            else
            {
                item.Quantity = request.Quantity;
            }
        }

        await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result<CartResponse>> UpdateSelectStateAsync(long customerId, CartSelectStateRequest request, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result<CartResponse>.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);

        var item = cart.Items.FirstOrDefault(i => 
            (request.ProductVariantId != 0 && i.ProductVariantId.HasValue && i.ProductVariantId.Value == request.ProductVariantId) ||
            (request.ProductVariantId == 0 && i.ProductId == request.ProductId));

        if (item == null) return Result<CartResponse>.Failure("Sản phẩm không có trong giỏ hàng", EErrorCode.NotFound);

        item.IsSelected = request.IsSelected;
        await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result<CartResponse>> RemoveItemFromCartAsync(long customerId, long productId, long productVariantId, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result<CartResponse>.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);

        var item = cart.Items.FirstOrDefault(i => 
            (productVariantId != 0 && i.ProductVariantId.HasValue && i.ProductVariantId.Value == productVariantId) ||
            (productVariantId == 0 && i.ProductId == productId));

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
