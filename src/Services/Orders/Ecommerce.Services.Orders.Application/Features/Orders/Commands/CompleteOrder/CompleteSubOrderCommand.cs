using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CompleteOrder;

public record CompleteSubOrderCommand(long SubOrderId, long CustomerId) : ICommand;
