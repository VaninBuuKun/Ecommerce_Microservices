using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Carts.Api.Features.Carts.Dtos;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetCart;

public class GetCartQueryHandler(
    ICacheService cacheService,
    IProductService productService,
    ISellerService sellerService,
    ILogger<GetCartQueryHandler> logger, IMapper mapper)
    : IQueryHandler<GetCartQuery, CartResponse>
{
    public async Task<Result<CartResponse>> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        long customerId = request.CustomerId;
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
                return Result<CartResponse>.Success(new CartResponse()
                {
                    CustomerId = customerId,
                    ShopGroups = []
                });
            }

            var variantIds = cart.Items.Select(i => i.ProductVariantId.ToString()).ToList();
            var listProductResult = await productService.GetProductVariantListAsync(variantIds);
            
            if (!listProductResult.IsSuccess)
            {
                return Result<CartResponse>.Failure(listProductResult.Message ?? "Lỗi khi lấy thông tin sản phẩm", listProductResult.ErrorCode);
            }

            var ListProductDto = listProductResult.Value;
            var productDist = ListProductDto.ToDictionary(p => p.VariantId);
            
            // Map flat items list
            var flatItems = mapper.Map<List<CartItemResponse>>(cart.Items);
            foreach (var item in flatItems)
            {
                if (productDist.TryGetValue(item.ProductVariantId, out var productInfo))
                {
                    mapper.Map(productInfo, item);
                }
            }

            // Lấy danh sách ShopId duy nhất trong giỏ hàng
            var shopIds = flatItems.Select(i => i.ShopId).Distinct().ToList();

            // Gọi sang Seller Service để lấy danh sách tên Shop tương ứng
            var shopNamesResult = await sellerService.GetShopNamesAsync(shopIds);
            var shopNamesDict = shopNamesResult.IsSuccess ? shopNamesResult.Value : new Dictionary<long, string>();

            // Gom nhóm các Cart Item theo ShopId
            var shopGroups = flatItems
                .GroupBy(i => i.ShopId)
                .Select(g => new ShopCartGroupResponse
                {
                    ShopId = g.Key,
                    ShopName = shopNamesDict.TryGetValue(g.Key, out var name) ? name : $"Cửa hàng #{g.Key}",
                    Items = g.ToList()
                })
                .ToList();

            var cartResponse = new CartResponse()
            {
                CustomerId = customerId,
                ShopGroups = shopGroups
            };
            
            return Result<CartResponse>.Success(cartResponse);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy giỏ hàng của khách hàng {CustomerId}: {Message}", customerId, ex.Message);
            return Result<CartResponse>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
