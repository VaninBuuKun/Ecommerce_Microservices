using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;
using Ecommerce.Services.Orders.Application.Services;
using Grpc.Core;
using CartItemDto = Ecommerce.Services.Orders.Application.Commons.Dtos.Cart.CartItemDto;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class CartClientService(CartGrpc.CartGrpcClient client) : ICartService
{
    public async Task<Result<CartDto>> GetCartByCustomerId(long customerId)
    {
        try
        {
            var cart = await client.GetCartByCustomerIdAsync(new GetCartByIdRequest() { CustomerId = customerId });

            var cartDto = new CartDto()
            {
                CustomerId = cart.CustomerId,
            };

            foreach (var item in cart.Items)
            {
                cartDto.Items.Add(new CartItemDto()
                {
                    VariantId = Guid.Parse(item.VariantId),
                    Quantity = item.Quantity,
                    IsSelected = item.IsSelected,
                    ProductId = Guid.TryParse(item.ProductId, out var prodId) ? prodId : Guid.Empty,
                    ProductName = item.ProductName,
                    VariantName = item.VariantName,
                    UnitPrice = decimal.TryParse(item.UnitPrice, out var uPrice) ? uPrice : 0,
                    ShopId = item.ShopId,
                    AvailableStocks = item.AvailableStocks,
                    Weight = item.Weight,
                    Length = item.Length,
                    Width = item.Width,
                    Height = item.Height
                });
            }

            return Result<CartDto>.Success(cartDto);
        }
        catch (RpcException ex)
        {
            return ex.ToResultFailure<CartDto>();
        }
        catch (Exception ex)
        {
            return Result<CartDto>.Failure($"Error retrieving cart: {ex.Message}", EErrorCode.InternalServerError);
        }
    }

    public async Task<Result> ClearCart(long customerId, List<Guid> variantIds)
    {
        try
        {
            var request = new ClearCartRequest { CustomerId = customerId };
            request.VariantIds.AddRange(variantIds.Select(id => id.ToString()));
            
            var response = await client.ClearCartAsync(request);
            if (!response.IsSuccess)
            {
                return Result.Failure(response.ErrorMessage, EErrorCode.InternalServerError);
            }
            return Result.Success();
        }
        catch (RpcException ex)
        {
            return ex.ToResultFailure();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Error clearing cart: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
};