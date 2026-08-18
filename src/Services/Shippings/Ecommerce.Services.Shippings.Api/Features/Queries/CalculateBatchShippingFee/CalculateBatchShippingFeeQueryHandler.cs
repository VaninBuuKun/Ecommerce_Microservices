using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Services;
using MediatR;

namespace Ecommerce.Services.Shippings.Api.Features.Queries.CalculateBatchShippingFee;

public class CalculateBatchShippingFeeQueryHandler(GhnShippingProvider ghnShippingProvider) 
    : IRequestHandler<CalculateBatchShippingFeeQuery, Result<List<Result<decimal>>>>
{
    public async Task<Result<List<Result<decimal>>>> Handle(CalculateBatchShippingFeeQuery request, CancellationToken cancellationToken)
    {
        var providerRequests = request.Items.Select(req => new CalculateFeeRequest(
            req.SenderWardId,
            request.RecipientWardId,
            req.Weight,
            req.Length,
            req.Width,
            req.Height
        )).ToList();

        var batchResult = await ghnShippingProvider.CalculateBatchFeeAsync(providerRequests, cancellationToken);
        return batchResult;
    }
}
