using Ecommerce.Services.Carts.Api.Models.Dtos;
using Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetCart;
using Ecommerce.Services.Carts.Api.Features.Carts.Commands.AddItemToCart;
using Ecommerce.Services.Carts.Api.Features.Carts.Commands.RemoveItemFromCart;
using Ecommerce.Services.Carts.Api.Features.Carts.Commands.UpdateQuantity;
using Ecommerce.Services.Carts.Api.Features.Carts.Commands.RemoveCart;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using BuildingBlocks.Auth;

namespace Ecommerce.Services.Carts.Api.Endpoints;

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
 
        // PUT /api/carts/items/{productId}
        group.MapPut("/items/{productId}", UpdateQuantity)
            .WithName("UpdateQuantity")
            .WithSummary("Cập nhật số lượng sản phẩm");
        
        // DELETE /api/carts/items/{productId}
        group.MapDelete("/items/{productId}", RemoveItem)
            .WithName("RemoveItem")
            .WithSummary("Xóa sản phẩm khỏi giỏ");
        
        // DELETE /api/carts
        group.MapDelete("/", ClearCart)
            .WithName("ClearCart")
            .WithSummary("Xóa toàn bộ giỏ hàng");

        return endpoints;
    }

    // 1. LẤY GIỎ HÀNG
    private static async Task<IResult> GetCart(ISender sender, ICurrentUserService userService)
    {
        var result = await sender.Send(new GetCartQuery(userService.UserId));
        
        return result.IsSuccess 
            ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode()) 
            : Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }

    // 2. THÊM SẢN PHẨM VÀO GIỎ
    private static async Task<IResult> AddItem([FromBody] CartItemRequest cartItem, ISender sender, ICurrentUserService userService)
    {
        var result = await sender.Send(new AddItemToCartCommand(userService.UserId, cartItem.VariantId, cartItem.Quantity));

        return result.IsSuccess
            ? Results.Json(result.Value, statusCode: result.GetHttpStatusCode())
            : Results.Content(result.Message, statusCode: result.GetHttpStatusCode());
    }
    
    // 3. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM
    private static async Task<IResult> UpdateQuantity(Guid productId, [FromBody] CartItemRequest cartItem, ISender sender, ICurrentUserService userService)
    {
        var result = await sender.Send(new UpdateQuantityCommand(userService.UserId, productId, cartItem.Quantity));
        
        return Results.Content(result.Message, statusCode: result.GetHttpStatusCode);
    }
    
    // 4. XÓA SẢN PHẨM KHỎI GIỎ
    private static async Task<IResult> RemoveItem(Guid productId, ISender sender, ICurrentUserService userService)
    {
        var result = await sender.Send(new RemoveItemFromCartCommand(userService.UserId, productId));
        
        return Results.Content(result.Message, statusCode: result.GetHttpStatusCode);
    }
    
    // 5. XÓA TOÀN BỘ GIỎ HÀNG
    private static async Task<IResult> ClearCart(ISender sender, ICurrentUserService userService)
    {
        var result = await sender.Send(new RemoveCartCommand(userService.UserId));
        
        return Results.Content(result.Message, statusCode: result.GetHttpStatusCode);
    }
}