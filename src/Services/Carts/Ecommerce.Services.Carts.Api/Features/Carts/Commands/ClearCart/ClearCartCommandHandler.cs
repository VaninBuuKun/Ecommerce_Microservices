using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;

namespace Ecommerce.Services.Carts.Api.Features.Carts.Commands.ClearCart;

public class ClearCartCommandHandler(
    ICacheService cacheService,
    ILogger<ClearCartCommandHandler> logger)
    : ICommandHandler<ClearCartCommand>
{
    private static readonly TimeSpan CartExpiry = TimeSpan.FromDays(7);

    public async Task<Result> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var customerId = request.CustomerId;
        try
        {
            var key = CartCacheKey.GetCartCacheKey(customerId);
            var cart = await cacheService.GetAsync<Cart>(key, cancellationToken);

            if (cart is null)
            {
                return Result.Failure("Không tìm thấy giỏ hàng", EErrorCode.NotFound);
            }

            int removedCount = cart.Items.RemoveAll(x => request.VariantIds.Contains(x.ProductVariantId));

            await cacheService.SetAsync(key, cart, CartExpiry, cancellationToken);
            
            logger.LogInformation("ClearCart gRPC: Đã xóa {Count} sản phẩm khỏi giỏ hàng của khách hàng {CustomerId}.", removedCount, customerId);

            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi xóa các sản phẩm khỏi giỏ hàng qua gRPC của khách hàng {CustomerId}: {Message}", customerId, ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}