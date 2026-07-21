using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Shippings.Api.Services;

public record CalculateFeeRequest(
    string SenderWardId,
    string RecipientWardId,
    double Weight,
    double Length,
    double Width,
    double Height
);

public record CreateWaybillRequest(
    Guid SubOrderId,
    Guid OrderId,
    string SenderWardId,
    string SenderName,
    string SenderPhone,
    string SenderAddress,
    string RecipientWardId,
    string RecipientAddress,
    string RecipientName,
    string RecipientPhone,
    double Weight,
    double Length,
    double Width,
    double Height,
    decimal CodAmount
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
    Task<Result<CreateWaybillResponse>> CreateWaybillAsync(CreateWaybillRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> CancelWaybillAsync(string waybillCode, CancellationToken cancellationToken = default);
}
