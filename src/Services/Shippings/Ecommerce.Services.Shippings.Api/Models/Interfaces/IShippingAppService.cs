using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Models.Dtos;

namespace Ecommerce.Services.Shippings.Api.Models.Interfaces;

public interface IShippingAppService
{
    Task<Result<LocationNamesDto>> GetLocationNamesAsync(long provinceId, long districtId, long wardId);
    Task<Result<List<Result<decimal>>>> CalculateBatchFeeAsync(List<CalculateFeeRequest> requests, CancellationToken cancellationToken = default);
}

public class LocationNamesDto
{
    public string ProvinceName { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;
}
