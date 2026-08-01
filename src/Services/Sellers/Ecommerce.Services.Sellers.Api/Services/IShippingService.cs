using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Sellers.Api.Services;

public record LocationNamesDto(string ProvinceName, string DistrictName, string WardName);
public record GhnShopRegistrationDto(long GhnShopId);

public interface IShippingService
{
    Task<Result<LocationNamesDto>> GetLocationNamesAsync(
        long provinceId, long districtId, long wardId, CancellationToken cancellationToken = default);
    
    Task<Result<GhnShopRegistrationDto>> RegisterGhnShopAsync(
        long wardId, string name, string phone, string address, CancellationToken cancellationToken = default);
}
