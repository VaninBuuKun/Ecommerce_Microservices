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

public static class CartEndpoints
{
    public static IEndpointRouteBuilder AddCartEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("api/carts").RequireAuthorization()
                             .WithTags("CartEndpoints")
                             .WithSummary("Bộ API quản lý giỏ hàng")
                             .WithOpenApi();
        
        // GET /api/carts
        group.MapGet("/", GetCart)
            .WithName("GetCart")
            .WithSummary("Lấy giỏ hàng của user");
        
        // POST /api/carts/items
        group.MapPost("/items", AddItem)
            .WithName("AddItem")
            .WithSummary("Thêm sản phẩm vào giỏ");
  
        // PUT /api/carts/items/quantity
        group.MapPut("/items/quantity", UpdateQuantity)
            .WithName("UpdateQuantity")
            .WithSummary("Cập nhật số lượng sản phẩm");

        // PUT /api/carts/items/select
        group.MapPut("/items/select", UpdateSelectState)
            .WithName("UpdateSelectState")
            .WithSummary("Cập nhật trạng thái chọn mua");

        // DELETE /api/carts/items
        group.MapDelete("/items", RemoveItem)
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
                : Results.Json(new { message = result.Message }, statusCode: result.GetHttpStatusCode());
    }

    // 2. THÊM SẢN PHẨM VÀO GIỎ
    private static async Task<IResult> AddItem([FromBody] CartItemRequest cartItem, ICartService cartService, ICurrentUserService userService)
    {
        var req = new AddItemToCartRequest(cartItem.VariantId, cartItem.Quantity, cartItem.IsSelected);
        var result = await cartService.AddItemToCartAsync(userService.UserId, req);
        
        Log.Information("User {UserId} added variant to cart: VariantId={VariantId}, Quantity={Quantity}", 
            userService.UserId, cartItem.VariantId, cartItem.Quantity);
        return result.IsSuccess
            ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode())
            : Results.Json(new { message = result.Message }, statusCode: result.GetHttpStatusCode());
    }
    
    // 3. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM
    private static async Task<IResult> UpdateQuantity([FromBody] UpdateCartItemQuantityRequest request, ICartService cartService, ICurrentUserService userService)
    {
        var req = new UpdateQuantityRequest(request.VariantId, request.Quantity);
        var result = await cartService.UpdateQuantityAsync(userService.UserId, req);
        
        return result.IsSuccess
            ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode())
            : Results.Json(new { message = result.Message }, statusCode: result.GetHttpStatusCode());
    }

    // 4. CẬP NHẬT TRẠNG THÁI CHỌN SẢN PHẨM
    private static async Task<IResult> UpdateSelectState([FromBody] UpdateCartItemSelectRequest request, ICartService cartService, ICurrentUserService userService)
    {
        var req = new CartSelectStateRequest(request.VariantId, request.IsSelected);
        var result = await cartService.UpdateSelectStateAsync(userService.UserId, req);
        
        return result.IsSuccess
            ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode())
            : Results.Json(new { message = result.Message }, statusCode: result.GetHttpStatusCode());
    }

    // 5. XÓA SẢN PHẨM KHỎI GIỎ
    private static async Task<IResult> RemoveItem([FromQuery] long variantId, ICartService cartService, ICurrentUserService userService)
    {
        var result = await cartService.RemoveItemFromCartAsync(userService.UserId, variantId);
        
        return result.IsSuccess
            ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode())
            : Results.Json(new { message = result.Message }, statusCode: result.GetHttpStatusCode());
    }

    // 6. XÓA TOÀN BỘ GIỎ HÀNG
    private static async Task<IResult> ClearCart(ICartService cartService, ICurrentUserService userService)
    {
        var result = await cartService.ClearCartAsync(userService.UserId);
        return result.IsSuccess
            ? Results.Json(new { message = "Đã xóa toàn bộ giỏ hàng" }, statusCode: result.GetHttpStatusCode())
            : Results.Json(new { message = result.Message }, statusCode: result.GetHttpStatusCode());
    }
}
