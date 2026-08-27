using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.ResolveDispute;

public record ResolveDisputeCommand(
    long DisputeThreadId,
    long AdminUserId,
    bool ApproveRefund, // true = AdminApproved (Khách thắng), false = AdminRejected (Shop thắng)
    string? AdminNote = null
) : ICommand;
