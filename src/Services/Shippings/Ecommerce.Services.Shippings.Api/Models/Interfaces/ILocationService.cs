using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Models.Dtos;

namespace Ecommerce.Services.Shippings.Api.Models.Interfaces;

public interface ILocationService
{
    Task<Result<List<ProvinceDto>>> GetProvincesAsync();
    Task<Result<List<DistrictDto>>> GetDistrictsAsync(long provinceId);
    Task<Result<List<WardDto>>> GetWardsAsync(long districtId);
    Task<Result<List<LocationSummaryDto>>> ResolveLocationsAsync(List<long> wardIds);
}
