using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Carts.Api.Models.Constansts;
using Ecommerce.Services.Carts.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetBasicCart;

public class GetBasicCartQueryHandler(
    ICacheService cacheService,
    ILogger<GetBasicCartQueryHandler> logger)
    : IQueryHandler<GetBasicCartQuery, Cart>
{
    public async Task<Result<Cart>> Handle(GetBasicCartQuery request, CancellationToken cancellationToken)
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

            return Result<Cart>.Success(cart);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy giỏ hàng cơ bản của khách hàng {CustomerId}: {Message}", customerId, ex.Message);
            return Result<Cart>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
