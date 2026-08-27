using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetDisputeThread;

public record GetDisputeThreadQuery(
    long RefundRequestId,
    long UserId
) : IQuery<DisputeThreadDto>;
