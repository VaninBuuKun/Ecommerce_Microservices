using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Shippings;

namespace Ecommerce.Services.Orders.Application.Services;

public record ShippingFeeRequestItem(
    long ShopId,
    long SenderWardId,
    long RecipientWardId,
    double Weight,
    double Length,
    double Width,
    double Height,
    string ShippingMethod
);

public record ShippingFeeResponseItem(
    long ShopId,
    bool IsSuccess,
    decimal Fee,
    string ErrorMessage
);

public interface IShippingService
{
    Task<Result<LocationDto>> GetLocationNameAsync(long provinceId, long districtId, long wardId);
    Task<Result<List<ShippingFeeResponseItem>>> CalculateBatchShippingFeeAsync(List<ShippingFeeRequestItem> items, CancellationToken cancellationToken = default);
}