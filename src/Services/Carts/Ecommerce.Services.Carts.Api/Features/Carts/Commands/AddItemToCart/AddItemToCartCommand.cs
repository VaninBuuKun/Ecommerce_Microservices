using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Microsoft.Extensions.Logging;

using BuildingBlocks.Grpc.Services;

namespace Ecommerce.Services.Carts.Api.Features.Carts.Commands.AddItemToCart;

public record AddItemToCartCommand(long CustomerId, Guid ProductVariantId, int Quantity) : ICommand<CartItem>;

public class AddItemToCartCommandHandler(
    ICacheService cacheService,
    IProductService productService,
    ISellerService sellerService,
    ILogger<AddItemToCartCommandHandler> logger)
    : ICommandHandler<AddItemToCartCommand, CartItem>
{
    private static readonly TimeSpan CartExpiry = TimeSpan.FromDays(7);

    public async Task<Result<CartItem>> Handle(AddItemToCartCommand request, CancellationToken cancellationToken)
    {
        long customerId = request.CustomerId;
        try
        {
            var key = CartCacheKey.GetCartCacheKey(customerId);
            var cart = await cacheService.GetAsync<Cart>(key, cancellationToken) ?? new Cart(customerId);

            var itemResponse = cart.Items.FirstOrDefault(x => x.ProductVariantId == request.ProductVariantId || x.ProductId == request.ProductVariantId);

            if (itemResponse is not null)
            {
                // Nếu sản phẩm đã tồn tại trong giỏ hàng, chỉ cần cập nhật thêm số lượng
                itemResponse.Quantity += request.Quantity;
            }
            else
            {
                logger.LogInformation("Đang thêm sản phẩm {ProductVariantId} vào giỏ hàng của khách hàng {CustomerId}", request.ProductVariantId, customerId);
                var productResult = await productService.GetProductVariantAsync(request.ProductVariantId);

                if (!productResult.IsSuccess)
                {
                    return Result<CartItem>.Failure(productResult.Message ?? "Có lỗi xảy ra", productResult.ErrorCode);
                }

                var product = productResult.Value!;

                // Gọi thông qua Interface trừu tượng ISellerService
                var isOwnerResult = await sellerService.ValidateShopOwnerAsync(product.ShopId, customerId);
                if (!isOwnerResult.IsSuccess)
                {
                    return Result<CartItem>.Failure(isOwnerResult);
                }

                if (isOwnerResult.Value)
                {
                    logger.LogWarning("AddToCart: Chủ shop {UserId} không được phép tự mua hàng của chính mình (Shop {ShopId}).", customerId, product.ShopId);
                    return Result<CartItem>.Failure("Bạn không thể thêm sản phẩm của chính cửa hàng mình vào giỏ hàng.", EErrorCode.Forbidden);
                }

                itemResponse = new CartItem
                {
                    ProductId = product.ProductId,
                    ProductVariantId = product.VariantId == Guid.Empty ? product.ProductId : product.VariantId,
                    Quantity = request.Quantity
                };
                cart.Items.Add(itemResponse);
            }

            await cacheService.SetAsync(key, cart, CartExpiry, cancellationToken);

            return Result<CartItem>.Success(itemResponse);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi thêm sản phẩm vào giỏ hàng của khách hàng {CustomerId}: {Message}", customerId, ex.Message);
            return Result<CartItem>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
