using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetMyRefunds;

public record GetMyRefundsQuery(long CustomerId) : IQuery<List<RefundRequestDto>>;
