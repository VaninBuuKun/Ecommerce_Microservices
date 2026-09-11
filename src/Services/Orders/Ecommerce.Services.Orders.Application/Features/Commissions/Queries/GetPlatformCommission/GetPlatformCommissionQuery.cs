using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Commissions.Queries.GetPlatformCommission;

public record GetPlatformCommissionQuery : IQuery<decimal>;
