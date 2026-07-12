using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Catalogs;

namespace Ecommerce.Services.Orders.Application.Services;

public interface IProductService
{
    Task<Result<ReserveStockResponseDto>> ReserveStockAsync(List<ReserveStockItemDto> items, CancellationToken cancellationToken = default);
}
