using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Shippings.Api.Features.Queries.CalculateBatchShippingFee;

public record BatchFeeItemRequest(long ShopId, long SenderWardId, int Weight, int Length, int Width, int Height);

public record CalculateBatchShippingFeeQuery(long RecipientWardId, List<BatchFeeItemRequest> Items) : IRequest<Result<List<Result<decimal>>>>;
