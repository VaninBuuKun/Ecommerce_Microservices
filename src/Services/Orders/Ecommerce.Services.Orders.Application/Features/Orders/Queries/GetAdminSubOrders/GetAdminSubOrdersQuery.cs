using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetAdminSubOrders;

public record PagedAdminSubOrdersResponse(
    List<CustomerOrderResponse> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages);

public record GetAdminSubOrdersQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? Status = null,
    string? SearchKeyword = null) : IQuery<PagedAdminSubOrdersResponse>;
