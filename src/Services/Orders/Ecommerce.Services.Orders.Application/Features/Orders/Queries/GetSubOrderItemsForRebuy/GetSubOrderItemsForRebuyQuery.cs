using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrderItemsForRebuy;

public record SubOrderItemRebuyResultDto(long VariantId, long ProductId, int Quantity);

public record GetSubOrderItemsForRebuyQuery(long SubOrderId, long CustomerId) 
    : IRequest<Result<List<SubOrderItemRebuyResultDto>>>;
