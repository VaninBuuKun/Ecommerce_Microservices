using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.CheckProductHasActiveSubOrders;

public record CheckProductHasActiveSubOrdersQuery(long ProductId) : IRequest<Result<bool>>;
