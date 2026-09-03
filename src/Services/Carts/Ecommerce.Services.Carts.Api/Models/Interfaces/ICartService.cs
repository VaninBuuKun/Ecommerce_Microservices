using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Converters;
using Ecommerce.Services.Carts.Api.Models.Dtos;

namespace Ecommerce.Services.Carts.Api.Models.Interfaces;

public record AddItemToCartRequest(
    long VariantId,
    int Quantity,
    bool IsSelected);

public record UpdateQuantityRequest(
    long VariantId,
    int Quantity);

public record CartSelectStateRequest(
    long VariantId,
    bool IsSelected);

public record RebuyCartRequest(
    [property: JsonConverter(typeof(NullableLongToStringJsonConverter))]
    long? SubOrderId = null,
    [property: JsonConverter(typeof(LongListToStringJsonConverter))]
    List<long>? VariantIds = null);

public interface ICartService
{
    Task<Result<CartResponse>> GetCartAsync(long customerId, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> AddItemToCartAsync(long customerId, AddItemToCartRequest request, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> UpdateQuantityAsync(long customerId, UpdateQuantityRequest request, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> UpdateSelectStateAsync(long customerId, CartSelectStateRequest request, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> RemoveItemFromCartAsync(long customerId, long variantId, CancellationToken cancellationToken = default);
    Task<Result> ClearCartAsync(long customerId, List<long>? variantIds = null, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> RebuyAsync(long customerId, RebuyCartRequest request, CancellationToken cancellationToken = default);
}
