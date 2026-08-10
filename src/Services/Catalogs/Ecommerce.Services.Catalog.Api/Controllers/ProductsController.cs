using BuildingBlocks.Auth;
using Ecommerce.Services.Catalog.Api.Models.Dtos;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariants;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.SetupProductVariants;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.InitSingleVariant;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.ToggleProductStatus;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetMyProducts;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProductById;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProducts;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetVariantById;
using Ecommerce.Services.Catalog.Application.Features.Reviews.Commands.CreateProductReview;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(ISender sender, ICurrentUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? searchTerm,
        [FromQuery] Guid? categoryId,
        [FromQuery] double? minRating,
        [FromQuery] string? cursor,
        [FromQuery] int limit = 10,
        [FromQuery] string sortBy = "name")
    {
        var result = await sender.Send(new GetProductsQuery(searchTerm, categoryId, minRating, cursor, limit, sortBy));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
    
    
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProducts(
        [FromQuery] int page, [FromQuery] int pageSize, [FromQuery] long ShopId, [FromQuery] string? searchTerm)
    {
        var result = await sender.Send(new GetMyProductsQuery(ShopId, userService.UserId, page, pageSize, searchTerm));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("{productId}/reviews")]
    [Authorize]
    public async Task<IActionResult> AddReview(Guid productId, [FromBody] AddReviewRequest request)
    {
        // Trích xuất UserId/CustomerId từ Claims trong JWT Token
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var customerId))
        {
            return Unauthorized("Không tìm thấy thông tin khách hàng trong Token.");
        }

        var result = await sender.Send(new CreateProductReviewCommand(
            productId,
            customerId,
            request.Rating,
            request.Comment,
            request.ImageUrls
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        var result = await sender.Send(new GetProductByIdQuery(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AddProduct(ProductRequest request)
    {
        var result = await sender.Send(new CreateProductCommand(
            request.ShopId,
            request.Name,
            request.Description,
            request.ThumbnailUrl
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
    {
        var result = await sender.Send(new UpdateProductCommand(
            id,
            request.Name,
            request.Description,
            request.ThumbnailUrl,
            request.VideoUrl,
            request.ImageUrls,
            request.CategoryId
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id}/sale")]
    public async Task<IActionResult> UpdateProductSale(Guid id, [FromBody] UpdateProductSaleRequest request)
    {
        var result = await sender.Send(new UpdateProductSaleCommand(
            id,
            request.Price,
            request.AvailableStock,
            request.Weight,
            request.Length,
            request.Width,
            request.Height,
            request.DiscountPrice
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id}/init-variants")]
    public async Task<IActionResult> InitVariants(Guid id, [FromBody] InitVariantsCommand command)
    {
        var result = await sender.Send(command with { ProductId = id });

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<IActionResult> ToggleProductStatus(Guid id)
    {
        var result = await sender.Send(new ToggleProductStatusCommand(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id}/variants")]
    public async Task<IActionResult> BulkUpdateVariants(Guid id, [FromBody] BulkUpdateVariantsRequest request)
    {
        var result = await sender.Send(new BulkUpdateVariantsCommand(id, request.Options, request.Variants));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var result = await sender.Send(new DeleteProductCommand(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("variants/{id}")]
    public async Task<IActionResult> GetProductVariant(Guid id)
    {
        var result = await sender.Send(new GetVariantByIdQuery(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
    

    [HttpDelete("variants/{id}")]
    public async Task<IActionResult> DeleteProductVariant(Guid id)
    {
        var result = await sender.Send(new DeleteProductVariantCommand(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}

public record UpdateProductRequest(
    string Name,
    string Description,
    string? ThumbnailUrl,
    string? VideoUrl,
    List<string> ImageUrls,
    Guid? CategoryId
);

public record UpdateProductSaleRequest(
    decimal Price,
    int AvailableStock,
    double Weight,
    double Length,
    double Width,
    double Height,
    decimal DiscountPrice
);

public record BulkUpdateVariantsRequest(
    List<BulkUpdateVariantDto> Variants,
    List<BulkUpdateOptionDto> Options
);

public record CreateProductVariantRequest(string? Sku, decimal Price, int AvailableStocks, List<Guid> OptionValueIds, double? Weight = null, double? Length = null, double? Width = null, double? Height = null);
public record UpdateProductVariantRequest(string? Sku, decimal Price, int AvailableStocks);
public record UpdateProductOptionRequest(string Name);
public record UpdateProductOptionValueRequest(string Value);
public record AddReviewRequest(int Rating, string Comment, List<string>? ImageUrls);