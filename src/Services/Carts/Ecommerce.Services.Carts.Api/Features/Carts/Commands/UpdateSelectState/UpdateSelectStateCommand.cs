using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.Features.Carts.Commands.UpdateSelectState;

public record UpdateSelectStateCommand(long CustomerId, Guid ProductVariantId, bool IsSelected) : ICommand;

public class UpdateSelectStateCommandHandler(
    ICacheService cacheService,
    ILogger<UpdateSelectStateCommandHandler> logger)
    : ICommandHandler<UpdateSelectStateCommand>
{
    private static readonly TimeSpan CartExpiry = TimeSpan.FromDays(7);

    public async Task<Result> Handle(UpdateSelectStateCommand request, CancellationToken cancellationToken)
    {
        var customerId = request.CustomerId;
        try
        {
            var key = CartCacheKey.GetCartCacheKey(customerId);
            var cart = await cacheService.GetAsync<Cart>(key, cancellationToken);

            if (cart is null)
            {
                return Result.Failure("Cart not found", EErrorCode.NotFound);
            }

            var existingItem = cart.Items.FirstOrDefault(x => x.ProductVariantId == request.ProductVariantId);

            if (existingItem is null)
            {
                return Result.Failure("Item not found", EErrorCode.NotFound);
            }

            existingItem.IsSelected = request.IsSelected;

            await cacheService.SetAsync(key, cart, CartExpiry, cancellationToken);

            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi cập nhật trạng thái chọn sản phẩm trong giỏ của khách hàng {CustomerId}: {Message}", customerId, ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
