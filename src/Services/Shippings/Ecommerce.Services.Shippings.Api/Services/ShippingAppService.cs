using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Shippings.Api.Models.Dtos;
using Ecommerce.Services.Shippings.Api.Models.Interfaces;
using Ecommerce.Services.Shippings.Api.Persistances;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Shippings.Api.Services;

public class ShippingAppService(
    ILocationService locationService,
    IShippingProvider shippingProvider,
    ShippingDbContext dbContext) : IShippingAppService
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

    public async Task<Result<Ecommerce.Services.Shippings.Api.Models.Entities.Shipment>> GetShipmentBySubOrderIdAsync(long subOrderId, CancellationToken cancellationToken = default)
    {
        var shipment = await dbContext.Shipments
            .FirstOrDefaultAsync(s => s.SubOrderId == subOrderId, cancellationToken);

        if (shipment == null)
        {
            return Result<Ecommerce.Services.Shippings.Api.Models.Entities.Shipment>.Failure("Không tìm thấy thông tin vận chuyển cho đơn hàng này.", EErrorCode.NotFound);
        }

        return Result<Ecommerce.Services.Shippings.Api.Models.Entities.Shipment>.Success(shipment);
    }

    public async Task<Result<PagedShipmentsDto>> GetShipmentsPagedAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Shipments.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var searchUpper = search.ToUpper();
            query = query.Where(s => (s.WaybillCode != null && s.WaybillCode.ToUpper().Contains(searchUpper)) ||
                                     s.RecipientName.ToUpper().Contains(searchUpper) ||
                                     s.RecipientPhone.Contains(searchUpper));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(s => s.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Result<PagedShipmentsDto>.Success(new PagedShipmentsDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
}
