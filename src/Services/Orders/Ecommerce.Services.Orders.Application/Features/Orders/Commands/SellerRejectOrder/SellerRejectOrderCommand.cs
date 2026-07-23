using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerRejectOrder;

public record SellerRejectOrderCommand(Guid SubOrderId, long ShopId, string Reason) : ICommand;
