using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.Features.Carts.Commands.UpdateQuantity;

public record UpdateQuantityCommand(long CustomerId, long ProductId, int Quantity) : ICommand;

public class UpdateQuantityCommandHandler(
    ICacheService cacheService,
    ILogger<UpdateQuantityCommandHandler> logger)
    : ICommandHandler<UpdateQuantityCommand>
{
    private static readonly TimeSpan CartExpiry = TimeSpan.FromDays(7);

    public async Task<Result> Handle(UpdateQuantityCommand request, CancellationToken cancellationToken)
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

            var existingItem = cart.Items.FirstOrDefault(x => x.ProductVariantId == request.ProductId || x.ProductId == request.ProductId);

            if (existingItem is null)
            {
                return Result.Failure("Item not found", EErrorCode.NotFound);
            }

            existingItem.Quantity = request.Quantity;

            if (existingItem.Quantity <= 0)
            {
                cart.Items.Remove(existingItem);
            }

            await cacheService.SetAsync(key, cart, CartExpiry, cancellationToken);

            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi cập nhật số lượng sản phẩm trong giỏ của khách hàng {CustomerId}: {Message}", customerId, ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
