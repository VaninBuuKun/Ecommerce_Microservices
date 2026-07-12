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
                    IsSelected = item.IsSelected
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
};