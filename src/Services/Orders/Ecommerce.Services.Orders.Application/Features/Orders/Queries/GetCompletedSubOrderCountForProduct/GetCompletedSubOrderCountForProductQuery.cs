using System;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetCompletedSubOrderCountForProduct;

public record GetCompletedSubOrderCountForProductQuery(long CustomerId, Guid ProductId) 
    : IRequest<Result<int>>;
