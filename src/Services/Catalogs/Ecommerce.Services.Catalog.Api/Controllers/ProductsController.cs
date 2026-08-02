using Ecommerce.Services.Catalog.Api.Models.Dtos;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.SetupProductVariants;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProductVariant;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductVariant;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductOption;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductOptionValue;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProductById;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProducts;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetVariantById;
using Ecommerce.Services.Catalog.Application.Features.Reviews.Commands.CreateProductReview;
using Ecommerce.Services.Catalog.Application.Features.Storage.Queries.GenerateUploadUrl;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(ISender sender) : ControllerBase
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

    [HttpGet("upload-url")]
    [Authorize]
    public async Task<IActionResult> GenerateUploadUrl([FromQuery] string fileName, [FromQuery] string contentType)
    {
        var result = await sender.Send(new GenerateUploadUrlQuery(fileName, contentType));

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
            request.Weight,
            request.Length,
            request.Width,
            request.Height
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(Guid id, ProductRequest request)
    {
        var result = await sender.Send(new UpdateProductCommand(
            id,
            request.Name,
            request.Description,
            request.Weight,
            request.Length,
            request.Width,
            request.Height
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id}/init-variants")]
    public async Task<IActionResult> UpdateProductVariantsSetup(Guid id, [FromBody] SetupProductVariantsCommand command)
    {
        var result = await sender.Send(command with { ProductId = id });

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

    [HttpPost("{productId}/variants")]
    public async Task<IActionResult> AddProductVariant(Guid productId, [FromBody] CreateProductVariantRequest request)
    {
        var result = await sender.Send(new CreateProductVariantCommand(
            productId,
            request.Sku,
            request.Price,
            request.AvailableStocks,
            request.OptionValueIds,
            request.Weight,
            request.Length,
            request.Width,
            request.Height
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("variants/{id}")]
    public async Task<IActionResult> UpdateProductVariant(Guid id, [FromBody] UpdateProductVariantRequest request)
    {
        var result = await sender.Send(new UpdateProductVariantCommand(
            id,
            request.Sku,
            request.Price,
            request.AvailableStocks
        ));

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

    [HttpPut("options/{id}")]
    public async Task<IActionResult> UpdateProductOption(Guid id, [FromBody] UpdateProductOptionRequest request)
    {
        var result = await sender.Send(new UpdateProductOptionCommand(id, request.Name));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("option-values/{id}")]
    public async Task<IActionResult> UpdateProductOptionValue(Guid id, [FromBody] UpdateProductOptionValueRequest request)
    {
        var result = await sender.Send(new UpdateProductOptionValueCommand(id, request.Value));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}

public record CreateProductVariantRequest(string? Sku, decimal Price, int AvailableStocks, List<Guid> OptionValueIds, double? Weight = null, double? Length = null, double? Width = null, double? Height = null);
public record UpdateProductVariantRequest(string? Sku, decimal Price, int AvailableStocks);
public record UpdateProductOptionRequest(string Name);
public record UpdateProductOptionValueRequest(string Value);
public record AddReviewRequest(int Rating, string Comment, List<string>? ImageUrls);