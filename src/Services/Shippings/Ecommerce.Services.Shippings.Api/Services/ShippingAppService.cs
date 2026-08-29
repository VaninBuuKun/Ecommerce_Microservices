using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Models.Dtos;
using Ecommerce.Services.Shippings.Api.Models.Interfaces;

namespace Ecommerce.Services.Shippings.Api.Services;

public class ShippingAppService(
    ILocationService locationService,
    IShippingProvider shippingProvider) : IShippingAppService
{
    public async Task<Result<LocationNamesDto>> GetLocationNamesAsync(long provinceId, long districtId, long wardId)
    {
        var provincesRes = await locationService.GetProvincesAsync();
        var province = provincesRes.Value?.Find(p => p.Id == provinceId);

        var districtsRes = await locationService.GetDistrictsAsync(provinceId);
        var district = districtsRes.Value?.Find(d => d.Id == districtId);

        var wardsRes = await locationService.GetWardsAsync(districtId);
        var ward = wardsRes.Value?.Find(w => w.Id == wardId);

        return Result<LocationNamesDto>.Success(new LocationNamesDto
        {
            ProvinceName = province?.Name ?? string.Empty,
            DistrictName = district?.Name ?? string.Empty,
            WardName = ward?.Name ?? string.Empty
        });
    }

    public async Task<Result<List<Result<decimal>>>> CalculateBatchFeeAsync(List<CalculateFeeRequest> requests, CancellationToken cancellationToken = default)
    {
        var results = await shippingProvider.CalculateBatchFeeAsync(requests, cancellationToken);
        return results;
    }
}
