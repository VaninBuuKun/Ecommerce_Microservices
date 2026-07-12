using BuildingBlocks.Auth;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Extensions;
using Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetBasicCart;
using Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetCart;
using Grpc.Core;
using MapsterMapper;
using MediatR;

namespace Ecommerce.Services.Carts.Api.GrpcServers;

public class CartGrpcService(ISender sender, IMapper mapper) : CartGrpc.CartGrpcBase
{
    public override async Task<GetCartByIdResponse> GetCartByCustomerId(GetCartByIdRequest request, ServerCallContext context)
    {
        var result = await sender.Send(new GetBasicCartQuery(request.CustomerId));
        if (!result.IsSuccess)
        {
            throw result.ToRpcException();
        }
        
        var cart = result.Value;
        var response = new GetCartByIdResponse
        {
            CustomerId = cart.CustomerId
        };
        
        foreach (var item in cart.Items)
        {
            response.Items.Add(new RpcCartItemDto()
            {
                VariantId = item.ProductVariantId.ToString(),
                Quantity = item.Quantity,
                IsSelected = item.IsSelected
            });
        }
        return response;
    }
}
