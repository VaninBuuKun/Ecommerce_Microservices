using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Catalog.Application.Commons.Interfaces;

public interface IOrderService
{
    Task<Result<int>> GetCompletedSubOrderCountForProductAsync(long customerId, Guid productId, CancellationToken cancellationToken = default);
}
