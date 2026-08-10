using BuildingBlocks.Auth;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetBasicCart;
using Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetCart;
using Grpc.Core;
using MapsterMapper;
using MassTransit.InMemoryTransport;
using MediatR;

namespace Ecommerce.Services.Carts.Api.GrpcServers;

public class CartGrpcService(ISender sender, IMapper mapper) : CartGrpc.CartGrpcBase
{
    public override async Task<GetCartByIdResponse> GetCartByCustomerId(GetCartByIdRequest request, ServerCallContext context)
    {
        var result = await sender.Send(new GetCartQuery(request.CustomerId));
        if (!result.IsSuccess)
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
                    response.Items.Add(new RpcCartItemDto()
                    {
                        VariantId = item.ProductVariantId.ToString(),
                        Quantity = item.Quantity,
                        IsSelected = item.IsSelected,
                        ProductId = item.ProductId.ToString(),
                        ProductName = item.ProductName,
                        VariantName = item.VariantName,
                        UnitPrice = item.UnitPrice.ToString(),
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
        var variantIds = request.VariantIds.Select(id => Guid.Parse(id)).ToList();
        var result = await sender.Send(new Ecommerce.Services.Carts.Api.Features.Carts.Commands.ClearCart.ClearCartCommand(request.CustomerId, variantIds));
        
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
