using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Commissions.Queries.GetPlatformCommission;

public class GetPlatformCommissionQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetPlatformCommissionQueryHandler> logger) : QueryHandler<GetPlatformCommissionQuery, decimal>
{
    private const decimal DefaultRate = 5.0m;

    protected override async Task<Result<decimal>> HandleQueryAsync(GetPlatformCommissionQuery query, CancellationToken cancellationToken)
    {
        var configRepo = unitOfWork.Repository<PlatformCommissionConfig, long>();
        var config = await configRepo.FirstOrDefaultAsync(c => true, null, cancellationToken);
        var rate = config?.RatePercentage ?? DefaultRate;

        return Result<decimal>.Success(rate);
    }
}
