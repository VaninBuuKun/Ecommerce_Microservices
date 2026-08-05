using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Shippings.Api.Services;

public record CalculateFeeRequest(
    long SenderWardId,
    long RecipientWardId,
    double Weight,
    double Length,
    double Width,
    double Height
);

public record CreateWaybillItemRequest(
    string Name,
    string Code,
    int Quantity,
    int Price
);

public record CreateWaybillRequest(
    Guid SubOrderId,
    Guid OrderId,
    string SenderName,
    string SenderPhone,
    string SenderAddress,
    long SenderWardId,
    long RecipientWardId,
    string RecipientAddress,
    string RecipientName,
    string RecipientPhone,
    double Weight,
    double Length,
    double Width,
    double Height,
    decimal CodAmount,
    List<CreateWaybillItemRequest> Items
);

public record CreateWaybillResponse(
    string WaybillCode,
    decimal ShippingFee,
    DateTime ExpectedDeliveryDate
);

public interface IShippingProvider
{
    string ProviderName { get; }
    Task<Result<decimal>> CalculateFeeAsync(CalculateFeeRequest request, CancellationToken cancellationToken = default);
    Task<Result<List<Result<decimal>>>> CalculateBatchFeeAsync(List<CalculateFeeRequest> requests, CancellationToken cancellationToken = default);
    Task<Result<CreateWaybillResponse>> CreateWaybillAsync(CreateWaybillRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> CancelWaybillAsync(string waybillCode, CancellationToken cancellationToken = default);
}
