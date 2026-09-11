using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Commissions.Commands.UpdatePlatformCommission;

public record UpdatePlatformCommissionCommand(decimal RatePercentage, long? UpdatedByUserId = null) : ICommand<decimal>;
