using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;
using Ecommerce.Services.Orders.Application.Services;
using Grpc.Core;

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
                    VariantId = item.VariantId,
                    Quantity = item.Quantity,
                    IsSelected = item.IsSelected,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    VariantName = item.VariantName,
                    UnitPrice = decimal.TryParse(item.UnitPrice, out var uPrice) ? uPrice : 0,
                    DiscountPrice = decimal.TryParse(item.DiscountPrice, out var dPrice) && dPrice > 0 ? dPrice : (decimal.TryParse(item.UnitPrice, out var uPrice2) ? uPrice2 : 0),
                    ShopId = item.ShopId,
                    AvailableStock = item.AvailableStock,
                    Weight = item.Weight,
                    Length = item.Length,
                    Width = item.Width,
                    Height = item.Height,
                    ThumbnailUrl = item.ThumbnailUrl
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

    public async Task<Result> ClearCart(long customerId, List<long> variantIds)
    {
        try
        {
            var request = new ClearCartRequest { CustomerId = customerId };
            request.VariantIds.AddRange(variantIds);
            
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
}