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
    Task<Result<Ecommerce.Services.Shippings.Api.Models.Entities.Shipment>> GetShipmentBySubOrderIdAsync(long subOrderId, CancellationToken cancellationToken = default);
    Task<Result<PagedShipmentsDto>> GetShipmentsPagedAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default);
}

public class PagedShipmentsDto
{
    public List<Ecommerce.Services.Shippings.Api.Models.Entities.Shipment> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class LocationNamesDto
{
    public string ProvinceName { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;
}
