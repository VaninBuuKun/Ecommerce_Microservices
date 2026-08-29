using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Carts.Api.Models.Dtos;

namespace Ecommerce.Services.Carts.Api.Models.Interfaces;

public record AddItemToCartRequest(
    long ProductId,
    long ProductVariantId,
    int Quantity,
    bool IsSelected);

public record UpdateQuantityRequest(
    long ProductId,
    long ProductVariantId,
    int Quantity);

public record CartSelectStateRequest(
    long ProductId,
    long ProductVariantId,
    bool IsSelected);

public interface ICartService
{
    Task<Result<CartResponse>> GetCartAsync(long customerId, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> AddItemToCartAsync(long customerId, AddItemToCartRequest request, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> UpdateQuantityAsync(long customerId, UpdateQuantityRequest request, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> UpdateSelectStateAsync(long customerId, CartSelectStateRequest request, CancellationToken cancellationToken = default);
    Task<Result<CartResponse>> RemoveItemFromCartAsync(long customerId, long productId, long productVariantId, CancellationToken cancellationToken = default);
    Task<Result> ClearCartAsync(long customerId, List<long>? variantIds = null, CancellationToken cancellationToken = default);
}
