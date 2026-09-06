using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.CheckVariantOrders;

public record VariantOrdersStatusDto(bool HasAnyOrders, bool HasActiveOrders);

public record CheckVariantOrdersQuery(long VariantId) : IRequest<Result<VariantOrdersStatusDto>>;
