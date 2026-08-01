using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetShopRefunds;

public record GetShopRefundsQuery(long ShopId, long SellerId) : IQuery<List<RefundRequestDto>>;
