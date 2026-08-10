using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Catalog.Application.Commons.Interfaces;

public interface ISellerService
{
    Task<Result<bool>> ValidateShopOwnerAsync(long shopId, long userId);
    Task<Result<ShopShippingInfoResultDto>> GetShopShippingInfoAsync(long shopId);
}

public record ShopShippingInfoResultDto(
    long ShopId,
    string ShopName,
    string Phone,
    string AddressLine,
    long WardId,
    long DistrictId,
    long ProvinceId,
    long OwnerUserId,
    string RecipientName
);
