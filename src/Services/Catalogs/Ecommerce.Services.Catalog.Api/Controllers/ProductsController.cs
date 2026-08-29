using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Api.Dtos;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariants;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProduct;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.InitSingleVariant;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.SetupProductVariants;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.ToggleProductStatus;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProduct;
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
public class ProductsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? searchTerm = null,
        [FromQuery] long? categoryId = null,
        [FromQuery] double? minRating = null,
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 10,
        [FromQuery] string sortBy = "name",
        [FromQuery] long? shopId = null)
    {
        var result = await sender.Send(new GetProductsQuery(searchTerm, categoryId, minRating, cursor, limit, sortBy, shopId));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("my-shop/{ShopId:long}")]
    public async Task<IActionResult> GetMyProducts(long ShopId, [FromServices] ICurrentUserService userService, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? searchTerm = null)
    {
        var result = await sender.Send(new GetMyProductsQuery(ShopId, userService.UserId, page, pageSize, searchTerm));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("{productId:long}/reviews")]
    public async Task<IActionResult> GetReviews(
        long productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await sender.Send(new Ecommerce.Services.Catalog.Application.Features.Reviews.Queries.GetProductReviews.GetProductReviewsQuery(productId, page, pageSize));
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("{productId:long}/reviews/summary")]
    public async Task<IActionResult> GetReviewsSummary(long productId)
    {
        var result = await sender.Send(new Ecommerce.Services.Catalog.Application.Features.Reviews.Queries.GetProductReviewsSummary.GetProductReviewsSummaryQuery(productId));
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("{productId:long}/reviews")]
    [Authorize]
    public async Task<IActionResult> AddReview(long productId, [FromBody] AddReviewRequest request)
    {
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

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetProduct(long id)
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

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateProduct(long id, [FromBody] UpdateProductRequest request)
    {
        var result = await sender.Send(new UpdateProductCommand(
            id,
            request.Name,
            request.Description,
            request.ThumbnailUrl,
            request.VideoUrl,
            request.ImageUrls,
            request.CategoryId,
            request.AttributesJson
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id:long}/sale")]
    public async Task<IActionResult> UpdateProductSale(long id, [FromBody] UpdateProductSaleRequest request)
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

    [HttpPut("{id:long}/init-variants")]
    public async Task<IActionResult> InitVariants(long id, [FromBody] InitVariantsCommand command)
    {
        var result = await sender.Send(command with { ProductId = id });

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id:long}/toggle-status")]
    public async Task<IActionResult> ToggleProductStatus(long id)
    {
        var result = await sender.Send(new ToggleProductStatusCommand(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id:long}/variants")]
    public async Task<IActionResult> BulkUpdateVariants(long id, [FromBody] BulkUpdateVariantsRequest request)
    {
        var result = await sender.Send(new BulkUpdateVariantsCommand(id, request.Options, request.Variants));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id:long}/attributes")]
    public async Task<IActionResult> UpdateAttributes(long id, [FromBody] UpdateAttributesRequest request)
    {
        var result = await sender.Send(new Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductAttributes.UpdateProductAttributesCommand(id, request.AttributesJson));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteProduct(long id)
    {
        var result = await sender.Send(new DeleteProductCommand(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("variants/{id:long}")]
    public async Task<IActionResult> GetProductVariant(long id)
    {
        var result = await sender.Send(new GetVariantByIdQuery(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpDelete("{productId:long}/variants/{variantId:long}")]
    public async Task<IActionResult> DeleteProductVariant(long productId, long variantId)
    {
        var result = await sender.Send(new DeleteProductVariantCommand(productId, variantId));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}

public record UpdateAttributesRequest(string? AttributesJson);