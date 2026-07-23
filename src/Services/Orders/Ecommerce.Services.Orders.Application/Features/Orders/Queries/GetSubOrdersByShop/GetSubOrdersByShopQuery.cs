using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrdersByShop;

public record GetSubOrdersByShopQuery(long ShopId, long UserId) : IQuery<List<CustomerOrderResponse>>;
