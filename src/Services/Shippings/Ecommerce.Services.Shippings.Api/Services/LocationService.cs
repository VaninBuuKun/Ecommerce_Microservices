using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Shippings.Api.Models.Dtos;
using Ecommerce.Services.Shippings.Api.Models.Interfaces;
using Ecommerce.Services.Shippings.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Shippings.Api.Services;

public class LocationService(
    ShippingDbContext dbContext,
    ICacheService cacheService,
    IMemoryCache memoryCache,
    ILogger<LocationService> logger
) : ILocationService
{
    private static readonly TimeSpan CacheExpiry = TimeSpan.FromHours(24);

    public async Task<Result<List<ProvinceDto>>> GetProvincesAsync()
    {
        const string cacheKey = "locations:provinces";

        // 1. Check L1 Memory Cache
        if (memoryCache.TryGetValue(cacheKey, out List<ProvinceDto>? memProvinces) && memProvinces != null)
        {
            return Result<List<ProvinceDto>>.Success(memProvinces);
        }

        // 2. Check L2 Redis Cache
        try
        {
            var redisProvinces = await cacheService.GetAsync<List<ProvinceDto>>(cacheKey);
            if (redisProvinces != null && redisProvinces.Count > 0)
            {
                memoryCache.Set(cacheKey, redisProvinces, CacheExpiry);
                return Result<List<ProvinceDto>>.Success(redisProvinces);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while reading provinces from cache key '{CacheKey}'", cacheKey);
        }

        // 3. Fallback to Database
        var provinces = await dbContext.Provinces
            .AsNoTracking()
            .OrderBy(p => p.DisplayName)
            .Select(p => new ProvinceDto(p.Id, p.Name, p.DisplayName))
            .ToListAsync();

        // 4. Populate L1 & L2 Caches
        memoryCache.Set(cacheKey, provinces, CacheExpiry);
        try
        {
            await cacheService.SetAsync(cacheKey, provinces, CacheExpiry);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while saving provinces to cache key '{CacheKey}'", cacheKey);
        }

        return Result<List<ProvinceDto>>.Success(provinces);
    }

    public async Task<Result<List<DistrictDto>>> GetDistrictsAsync(long provinceId)
    {
        var cacheKey = $"locations:districts:{provinceId}";

        // 1. Check L1 Memory Cache
        if (memoryCache.TryGetValue(cacheKey, out List<DistrictDto>? memDistricts) && memDistricts != null)
        {
            return Result<List<DistrictDto>>.Success(memDistricts);
        }

        // 2. Check L2 Redis Cache
        try
        {
            var redisDistricts = await cacheService.GetAsync<List<DistrictDto>>(cacheKey);
            if (redisDistricts != null && redisDistricts.Count > 0)
            {
                memoryCache.Set(cacheKey, redisDistricts, CacheExpiry);
                return Result<List<DistrictDto>>.Success(redisDistricts);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while reading districts from cache key '{CacheKey}'", cacheKey);
        }

        // 3. Fallback to Database
        var districts = await dbContext.Districts
            .AsNoTracking()
            .Where(d => d.ProvinceId == provinceId)
            .OrderBy(d => d.DisplayName)
            .Select(d => new DistrictDto(d.Id, d.ProvinceId, d.Name, d.DisplayName))
            .ToListAsync();

        // 4. Populate L1 & L2 Caches
        memoryCache.Set(cacheKey, districts, CacheExpiry);
        try
        {
            await cacheService.SetAsync(cacheKey, districts, CacheExpiry);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while saving districts to cache key '{CacheKey}'", cacheKey);
        }

        return Result<List<DistrictDto>>.Success(districts);
    }

    public async Task<Result<List<WardDto>>> GetWardsAsync(long districtId)
    {
        var cacheKey = $"locations:wards:{districtId}";

        // 1. Check L1 Memory Cache
        if (memoryCache.TryGetValue(cacheKey, out List<WardDto>? memWards) && memWards != null)
        {
            return Result<List<WardDto>>.Success(memWards);
        }

        // 2. Check L2 Redis Cache
        try
        {
            var redisWards = await cacheService.GetAsync<List<WardDto>>(cacheKey);
            if (redisWards != null && redisWards.Count > 0)
            {
                memoryCache.Set(cacheKey, redisWards, CacheExpiry);
                return Result<List<WardDto>>.Success(redisWards);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while reading wards from cache key '{CacheKey}'", cacheKey);
        }

        // 3. Fallback to Database
        var wards = await dbContext.Wards
            .AsNoTracking()
            .Where(w => w.DistrictId == districtId)
            .OrderBy(w => w.DisplayName)
            .Select(w => new WardDto(w.Id, w.DistrictId, w.Name, w.DisplayName))
            .ToListAsync();

        // 4. Populate L1 & L2 Caches
        memoryCache.Set(cacheKey, wards, CacheExpiry);
        try
        {
            await cacheService.SetAsync(cacheKey, wards, CacheExpiry);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while saving wards to cache key '{CacheKey}'", cacheKey);
        }

        return Result<List<WardDto>>.Success(wards);
    }

    public async Task<Result<List<LocationSummaryDto>>> ResolveLocationsAsync(List<long> wardIds)
    {
        if (wardIds == null || wardIds.Count == 0)
        {
            return Result<List<LocationSummaryDto>>.Success(new List<LocationSummaryDto>());
        }

        var distinctWardIds = wardIds.Where(id => id > 0).Distinct().OrderBy(id => id).ToList();
        if (distinctWardIds.Count == 0)
        {
            return Result<List<LocationSummaryDto>>.Success(new List<LocationSummaryDto>());
        }

        var cacheKey = $"locations:resolve:{string.Join(",", distinctWardIds)}";

        // 1. Check L1 Memory Cache
        if (memoryCache.TryGetValue(cacheKey, out List<LocationSummaryDto>? memResolved) && memResolved != null)
        {
            return Result<List<LocationSummaryDto>>.Success(memResolved);
        }

        // 2. Check L2 Redis Cache
        try
        {
            var redisResolved = await cacheService.GetAsync<List<LocationSummaryDto>>(cacheKey);
            if (redisResolved != null && redisResolved.Count > 0)
            {
                memoryCache.Set(cacheKey, redisResolved, CacheExpiry);
                return Result<List<LocationSummaryDto>>.Success(redisResolved);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while reading resolved locations from cache key '{CacheKey}'", cacheKey);
        }

        // 3. Fallback to Database
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

        // 4. Populate L1 & L2 Caches
        memoryCache.Set(cacheKey, query, CacheExpiry);
        try
        {
            await cacheService.SetAsync(cacheKey, query, CacheExpiry);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis error while saving resolved locations to cache key '{CacheKey}'", cacheKey);
        }

        return Result<List<LocationSummaryDto>>.Success(query);
    }
}
