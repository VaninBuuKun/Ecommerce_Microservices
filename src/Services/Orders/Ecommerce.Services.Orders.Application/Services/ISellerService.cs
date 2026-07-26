using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Orders.Application.Services;

public interface ISellerService
{
    Task<Result<bool>> ValidateShopOwnerAsync(long shopId, long sellerId, CancellationToken cancellationToken = default);
}
