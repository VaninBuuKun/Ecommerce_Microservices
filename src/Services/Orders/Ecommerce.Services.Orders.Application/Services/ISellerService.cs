using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Sellers;

namespace Ecommerce.Services.Orders.Application.Services;

public interface ISellerService
{
    Task<Result<bool>> ValidateShopOwnerAsync(long shopId, long sellerId, CancellationToken cancellationToken = default);
    Task<Result<ShopShippingInfoDto>> GetShopShippingInfoAsync(long shopId, CancellationToken cancellationToken = default);
    Task<Result<List<ShopShippingInfoDto>>> GetShopsShippingInfoAsync(List<long> shopIds, CancellationToken cancellationToken = default);
}

