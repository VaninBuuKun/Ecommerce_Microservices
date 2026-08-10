using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrdersByShop;

public record PagedOrdersResponse(
    List<CustomerOrderResponse> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages);

public record GetSubOrdersByShopQuery(
    long ShopId, 
    long UserId, 
    int PageNumber = 1, 
    int PageSize = 5, 
    string? Status = null) : IQuery<PagedOrdersResponse>;
