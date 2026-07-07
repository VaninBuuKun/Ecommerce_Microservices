using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;
using Ecommerce.Services.Orders.Application.Services;

using CartGrpcItemDto = BuildingBlocks.Grpc.Services.CartItemDto;
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
                    ProductName = item.ProductName,
                    VariantName = item.VariantName,
                    UnitPrice = decimal.Parse(item.UnitPrice),
                    AvailableStocks = item.AvailableStocks,
                    Quantity = item.Quantity
                });
            }
            
            return Result<CartDto>.Success(cartDto);
        }
        catch (Grpc.Core.RpcException ex)
        {
            return Result<CartDto>.ValidationFailure($"Error fetching cart: {ex.Status.Detail}");
        }
    }
}