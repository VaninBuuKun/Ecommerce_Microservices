using System;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Carts.Api.GrpcServers;

public class CartGrpcServer(ICartService cartService, ILogger<CartGrpcServer> logger) : CartGrpc.CartGrpcBase
{
    public override async Task<GetCartByIdResponse> GetCartByCustomerId(GetCartByIdRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC GetCartByCustomerId: Nhận yêu cầu lấy giỏ hàng cho khách hàng #{CustomerId}", request.CustomerId);
        
        var result = await cartService.GetCartAsync(request.CustomerId, context.CancellationToken);
        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetCartByCustomerId: Không lấy được giỏ hàng của khách hàng #{CustomerId}: {Message}", 
                request.CustomerId, result.Message);
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
                if (group.Items == null) continue;

                foreach (var item in group.Items)
                {
                    response.Items.Add(new RpcCartItemDto
                    {
                        VariantId = item.ProductVariantId,
                        Quantity = item.Quantity,
                        IsSelected = item.IsSelected,
                        ProductId = item.ProductId,
                        ProductName = item.ProductName ?? string.Empty,
                        VariantName = item.VariantName ?? string.Empty,
                        UnitPrice = item.UnitPrice.ToString(),
                        DiscountPrice = item.DiscountPrice.ToString(),
                        ShopId = item.ShopId,
                        AvailableStocks = item.AvailableStocks,
                        ThumbnailUrl = item.ThumbnailUrl ?? string.Empty
                    });
                }
            }
        }

        logger.LogInformation("gRPC GetCartByCustomerId: Trả về {Count} sản phẩm cho khách hàng #{CustomerId}", 
            response.Items.Count, request.CustomerId);
        return response;
    }

    public override async Task<ClearCartResponse> ClearCart(ClearCartRequest request, ServerCallContext context)
    {
        var variantIds = request.VariantIds.ToList();
        logger.LogInformation("gRPC ClearCart: Xóa {Count} sản phẩm đã đặt khỏi giỏ hàng khách hàng #{CustomerId}", 
            variantIds.Count, request.CustomerId);

        var result = await cartService.ClearCartAsync(request.CustomerId, variantIds, context.CancellationToken);
        
        if (!result.IsSuccess)
        {
            logger.LogWarning("gRPC ClearCart thất bại cho khách hàng #{CustomerId}: {Message}", 
                request.CustomerId, result.Message);
            return new ClearCartResponse
            {
                IsSuccess = false,
                ErrorMessage = result.Message ?? "Không thể dọn dẹp giỏ hàng."
            };
        }

        logger.LogInformation("gRPC ClearCart thành công cho khách hàng #{CustomerId}", request.CustomerId);
        return new ClearCartResponse
        {
            IsSuccess = true
        };
    }
}
