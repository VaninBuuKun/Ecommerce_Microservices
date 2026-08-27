using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.EscalateToDispute;

public record EscalateToDisputeCommand(
    long RefundRequestId,
    long CustomerId,
    string? ReasonNote = null
) : ICommand;
