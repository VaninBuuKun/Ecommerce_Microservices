using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Models.Dtos;
using Ecommerce.Services.Shippings.Api.Persistances;
using Microsoft.EntityFrameworkCore;

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
}
