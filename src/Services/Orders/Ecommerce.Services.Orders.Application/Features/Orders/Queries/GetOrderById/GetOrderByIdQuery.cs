using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetOrderById;

public record GetOrderByIdQuery(Guid OrderId, long CustomerId) : IQuery<CustomerOrderResponse>;
