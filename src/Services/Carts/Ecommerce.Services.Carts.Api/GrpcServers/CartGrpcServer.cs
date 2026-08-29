using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Grpc.Core;

namespace Ecommerce.Services.Carts.Api.GrpcServers;

public class CartGrpcServer(ICartService cartService) : CartGrpc.CartGrpcBase
{
    public override async Task<GetCartByIdResponse> GetCartByCustomerId(GetCartByIdRequest request, ServerCallContext context)
    {
        var result = await cartService.GetCartAsync(request.CustomerId, context.CancellationToken);
        if (!result.IsSuccess || result.Value == null)
        {
            throw result.ToRpcException();
        }
        
        var cart = result.Value;
        var response = new GetCartByIdResponse
        {
            CustomerId = cart.CustomerId
        };
        
        if (cart.ShopGroups != null)
        {
            foreach (var group in cart.ShopGroups)
            {
                foreach (var item in group.Items)
                {
                    response.Items.Add(new RpcCartItemDto
                    {
                        VariantId = item.ProductVariantId,
                        Quantity = item.Quantity,
                        IsSelected = item.IsSelected,
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,
                        VariantName = item.VariantName,
                        UnitPrice = item.UnitPrice.ToString(),
                        DiscountPrice = item.DiscountPrice.ToString(),
                        ShopId = item.ShopId,
                        AvailableStocks = item.AvailableStocks,
                        ThumbnailUrl = item.ThumbnailUrl
                    });
                }
            }
        }
        return response;
    }

    public override async Task<ClearCartResponse> ClearCart(ClearCartRequest request, ServerCallContext context)
    {
        var variantIds = request.VariantIds.ToList();
        var result = await cartService.ClearCartAsync(request.CustomerId, variantIds, context.CancellationToken);
        
        if (!result.IsSuccess)
        {
            return new ClearCartResponse
            {
                IsSuccess = false,
                ErrorMessage = result.Message
            };
        }

        return new ClearCartResponse
        {
            IsSuccess = true
        };
    }
}
