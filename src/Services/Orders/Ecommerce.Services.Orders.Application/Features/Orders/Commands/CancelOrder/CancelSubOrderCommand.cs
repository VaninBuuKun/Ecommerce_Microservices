using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelOrder;

public record CancelSubOrderCommand(long SubOrderId, long CustomerId, string Reason) : ICommand;
