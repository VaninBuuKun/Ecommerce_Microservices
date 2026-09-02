using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Dtos;
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
                .Where(i => i.VariantId > 0)
                .Select(i => i.VariantId)
                .Distinct()
                .ToList();

            var listProductResult = await productService.GetProductVariantListAsync(variantIds);
            
            if (!listProductResult.IsSuccess)
            {
                return Result<CartResponse>.Failure(listProductResult.Message ?? "Lỗi khi kết nối thông tin sản phẩm", listProductResult.ErrorCode);
            }

            var listProductDto = listProductResult.Value ?? new List<ProductDto>();
            var productDist = listProductDto
                .Where(p => p.VariantId != 0)
                .ToDictionary(p => p.VariantId, p => p);
            
            var validItems = new List<CartItem>();
            var validItemResponses = new List<CartItemResponse>();
            bool hasModifiedCart = false;

            foreach (var cartItem in cart.Items)
            {
                if (productDist.TryGetValue(cartItem.VariantId, out var productInfo))
                {
                    int availableStock = productInfo.AvailableStock;

                    // Nếu số lượng hiện tại vượt quá tồn kho khả dụng thì gán về bằng tồn kho hiện tại
                    if (availableStock > 0 && cartItem.Quantity > availableStock)
                    {
                        cartItem.Quantity = availableStock;
                        hasModifiedCart = true;
                    }

                    validItems.Add(cartItem);

                    validItemResponses.Add(new CartItemResponse
                    {
                        ProductId = productInfo.ProductId,
                        VariantId = cartItem.VariantId,
                        Quantity = cartItem.Quantity,
                        IsSelected = cartItem.IsSelected,
                        ProductName = productInfo.ProductName,
                        VariantName = productInfo.VariantName,
                        UnitPrice = productInfo.UnitPrice,
                        DiscountPrice = productInfo.DiscountPrice,
                        AvailableStock = availableStock,
                        ShopId = productInfo.ShopId,
                        ThumbnailUrl = productInfo.ThumbnailUrl,
                        Weight = productInfo.Weight,
                        Length = productInfo.Length,
                        Width = productInfo.Width,
                        Height = productInfo.Height
                    });
                }
                else
                {
                    // Biến thể không còn tồn tại -> Tự động dọn dẹp khỏi Redis
                    hasModifiedCart = true;
                    logger.LogInformation("Tự động dọn dẹp biến thể không tồn tại khỏi giỏ hàng user {CustomerId}: VariantId={VariantId}",
                        customerId, cartItem.VariantId);
                }
            }

            // Cập nhật lại Redis Cache nếu có dọn dẹp hoặc điều chỉnh số lượng
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

        if (request.VariantId <= 0)
        {
            return Result<CartResponse>.Failure("Vui lòng chọn phân loại sản phẩm hợp lệ.", EErrorCode.ValidationErrors);
        }

        // Gọi gRPC sang Catalog để xác thực biến thể & kiểm tra tồn kho trước khi lưu
        var productResult = await productService.GetProductVariantAsync(request.VariantId);
        if (!productResult.IsSuccess || productResult.Value == null)
        {
            return Result<CartResponse>.Failure(productResult.Message ?? "Không tìm thấy biến thể sản phẩm này trong hệ thống.", EErrorCode.NotFound);
        }

        var productInfo = productResult.Value;
        int availableStock = productInfo.AvailableStock;

        if (availableStock <= 0)
        {
            return Result<CartResponse>.Failure("Sản phẩm này hiện tại đã hết hàng.", EErrorCode.ValidationErrors);
        }

        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken) 
                   ?? new Cart(customerId);

        var existingItem = cart.Items.FirstOrDefault(i => i.VariantId == request.VariantId);

        if (existingItem != null)
        {
            int newQuantity = existingItem.Quantity + request.Quantity;
            existingItem.Quantity = newQuantity > availableStock ? availableStock : newQuantity;
            existingItem.IsSelected = request.IsSelected;
        }
        else
        {
            int initQuantity = request.Quantity > availableStock ? availableStock : request.Quantity;
            cart.Items.Add(new CartItem 
            { 
                VariantId = request.VariantId, 
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

        var item = cart.Items.FirstOrDefault(i => i.VariantId == request.VariantId);

        if (item == null) return Result<CartResponse>.Failure("Sản phẩm không có trong giỏ hàng", EErrorCode.NotFound);

        if (request.Quantity <= 0)
        {
            cart.Items.Remove(item);
        }
        else
        {
            // Kiểm tra tồn kho khả dụng qua gRPC
            var productResult = await productService.GetProductVariantAsync(item.VariantId);
            if (productResult.IsSuccess && productResult.Value != null)
            {
                int availableStock = productResult.Value.AvailableStock;
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

        var item = cart.Items.FirstOrDefault(i => i.VariantId == request.VariantId);

        if (item == null) return Result<CartResponse>.Failure("Sản phẩm không có trong giỏ hàng", EErrorCode.NotFound);

        item.IsSelected = request.IsSelected;
        await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        return await GetCartAsync(customerId, cancellationToken);
    }

    public async Task<Result<CartResponse>> RemoveItemFromCartAsync(long customerId, long variantId, CancellationToken cancellationToken = default)
    {
        var cart = await cacheService.GetAsync<Cart>(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        if (cart == null) return Result<CartResponse>.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);

        var item = cart.Items.FirstOrDefault(i => i.VariantId == variantId);

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
            cart.Items.RemoveAll(i => variantIds.Contains(i.VariantId));
            await cacheService.SetAsync(CartCacheKey.GetCartCacheKey(customerId), cart, TimeSpan.FromDays(7), cancellationToken);
        }
        else
        {
            await cacheService.RemoveAsync(CartCacheKey.GetCartCacheKey(customerId), cancellationToken);
        }

        return Result.Success();
    }
}
