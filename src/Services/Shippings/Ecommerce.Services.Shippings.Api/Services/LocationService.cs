using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Models.Dtos;
using Ecommerce.Services.Shippings.Api.Persistances;
using Microsoft.EntityFrameworkCore;

using Ecommerce.Services.Shippings.Api.Models.Interfaces;

namespace Ecommerce.Services.Shippings.Api.Services;

public class LocationService(ShippingDbContext dbContext) : ILocationService
{
    public async Task<Result<List<ProvinceDto>>> GetProvincesAsync()
    {
        var provinces = await dbContext.Provinces
            .OrderBy(p => p.DisplayName)
            .Select(p => new ProvinceDto(p.Id, p.Name, p.DisplayName))
            .ToListAsync();
            
        return Result<List<ProvinceDto>>.Success(provinces);
    }

    public async Task<Result<List<DistrictDto>>> GetDistrictsAsync(long provinceId)
    {
        var districts = await dbContext.Districts
            .Where(d => d.ProvinceId == provinceId)
            .OrderBy(d => d.DisplayName)
            .Select(d => new DistrictDto(d.Id, d.ProvinceId, d.Name, d.DisplayName))
            .ToListAsync();
            
        return Result<List<DistrictDto>>.Success(districts);
    }

    public async Task<Result<List<WardDto>>> GetWardsAsync(long districtId)
    {
        var wards = await dbContext.Wards
            .Where(w => w.DistrictId == districtId)
            .OrderBy(w => w.DisplayName)
            .Select(w => new WardDto(w.Id, w.DistrictId, w.Name, w.DisplayName))
            .ToListAsync();
            
        return Result<List<WardDto>>.Success(wards);
    }

    public async Task<Result<List<LocationSummaryDto>>> ResolveLocationsAsync(List<long> wardIds)
    {
        if (wardIds == null || wardIds.Count == 0)
        {
            return Result<List<LocationSummaryDto>>.Success(new List<LocationSummaryDto>());
        }

        var distinctWardIds = wardIds.Where(id => id > 0).Distinct().ToList();

        var query = await dbContext.Wards
            .AsNoTracking()
            .Where(w => distinctWardIds.Contains(w.Id))
            .Include(w => w.District)
            .ThenInclude(d => d.Province)
            .Select(w => new LocationSummaryDto(
                w.District.Province.Id,
                string.IsNullOrEmpty(w.District.Province.DisplayName) ? w.District.Province.Name : w.District.Province.DisplayName,
                w.District.Id,
                string.IsNullOrEmpty(w.District.DisplayName) ? w.District.Name : w.District.DisplayName,
                w.Id,
                string.IsNullOrEmpty(w.DisplayName) ? w.Name : w.DisplayName
            ))
            .ToListAsync();

        return Result<List<LocationSummaryDto>>.Success(query);
    }
}
