using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerConfirmOrder;

public record SellerConfirmOrderCommand(Guid SubOrderId, long SellerId) : ICommand;
