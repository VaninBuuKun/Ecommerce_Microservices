using System.Threading.Tasks;
using BuildingBlocks.Auth;
using Ecommerce.Services.Carts.Api.Models.Dtos;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Serilog;

namespace Ecommerce.Services.Carts.Api.Endpoints;

public record LocalUpdateSelectStateRequest(bool IsSelected);

public static class CartEndpoints
{
    public static IEndpointRouteBuilder AddCartEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("api/carts").RequireAuthorization()
                             .WithTags("CartEndpoints")
                             .WithSummary("Đây là bộ API quản lý giỏ hàng")
                             .WithOpenApi();
        
        // GET /api/carts
        group.MapGet("/", GetCart)
            .WithName("GetCart")
            .WithSummary("Lấy giỏ hàng của user");
        
        // POST /api/carts/items
        group.MapPost("/items", AddItem)
            .WithName("AddItem")
            .WithSummary("Thêm sản phẩm vào giỏ");
  
        // PUT /api/carts/items/{productId:long}
        group.MapPut("/items/{productId:long}", UpdateQuantity)
            .WithName("UpdateQuantity")
            .WithSummary("Cập nhật số lượng sản phẩm");

        // PUT /api/carts/items/{variantId:long}/select
        group.MapPut("/items/{variantId:long}/select", UpdateSelectState)
            .WithName("UpdateSelectState")
            .WithSummary("Cập nhật trạng thái chọn mua sản phẩm");
        
        // DELETE /api/carts/items/{productId:long}
        group.MapDelete("/items/{productId:long}", RemoveItem)
            .WithName("RemoveItem")
            .WithSummary("Xóa sản phẩm khỏi giỏ");
        
        // DELETE /api/carts
        group.MapDelete("/", ClearCart)
            .WithName("ClearCart")
            .WithSummary("Xóa toàn bộ giỏ hàng");

        return endpoints;
    }

    // 1. LẤY GIỎ HÀNG
    private static async Task<IResult> GetCart(ICartService cartService, ICurrentUserService userService)
    {
        var result = await cartService.GetCartAsync(userService.UserId);
        return result.IsSuccess 
                ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode()) 
                : Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }

    // 2. THÊM SẢN PHẨM VÀO GIỎ
    private static async Task<IResult> AddItem([FromBody] CartItemRequest cartItem, ICartService cartService, ICurrentUserService userService)
    {
        var req = new AddItemToCartRequest(cartItem.ProductId, cartItem.VariantId, cartItem.Quantity, true);
        var result = await cartService.AddItemToCartAsync(userService.UserId, req);
        
        Log.Information("User {UserId} added product {VariantId} with quantity {Quantity} to cart", userService.UserId, cartItem.VariantId, cartItem.Quantity);
        return result.IsSuccess
            ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode())
            : Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }
    
    // 3. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM
    private static async Task<IResult> UpdateQuantity(long productId, [FromBody] CartItemRequest cartItem, ICartService cartService, ICurrentUserService userService)
    {
        var req = new UpdateQuantityRequest(productId, cartItem.VariantId, cartItem.Quantity);
        var result = await cartService.UpdateQuantityAsync(userService.UserId, req);
        
        return Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }

    // 3.5. CẬP NHẬT TRẠNG THÁI CHỌN SẢN PHẨM
    private static async Task<IResult> UpdateSelectState(long variantId, [FromBody] LocalUpdateSelectStateRequest request, ICartService cartService, ICurrentUserService userService)
    {
        var req = new CartSelectStateRequest(0, variantId, request.IsSelected);
        var result = await cartService.UpdateSelectStateAsync(userService.UserId, req);
        
        return Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }
    
    // 4. XÓA SẢN PHẨM KHỎI GIỎ
    private static async Task<IResult> RemoveItem(long productId, ICartService cartService, ICurrentUserService userService)
    {
        var result = await cartService.RemoveItemFromCartAsync(userService.UserId, productId, 0);
        
        return Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }
    
    // 5. XÓA TOÀN BỘ GIỎ HÀNG
    private static async Task<IResult> ClearCart(ICartService cartService, ICurrentUserService userService)
    {
        var result = await cartService.ClearCartAsync(userService.UserId);
        
        return Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }
}
