using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Catalog.Application.Commons.Interfaces;

public interface IOrderService
{
    Task<Result<int>> GetCompletedSubOrderCountForProductAsync(long customerId, long productId, CancellationToken cancellationToken = default);
    Task<Result<bool>> CheckProductHasActiveSubOrdersAsync(long productId, CancellationToken cancellationToken = default);
    Task<Result<(bool HasAnyOrders, bool HasActiveOrders)>> CheckVariantOrdersAsync(long variantId, CancellationToken cancellationToken = default);
}
