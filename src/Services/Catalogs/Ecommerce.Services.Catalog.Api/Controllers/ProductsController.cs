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
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var result = await sender.Send(new GetProductsQuery());

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
    public async Task<IActionResult> AddProduct(ProductRequest request)
    {
        var result = await sender.Send(new CreateProductCommand(
            request.ShopId,
            request.Name,
            request.Description
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
            request.Description
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
            request.OptionValueIds
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

public record CreateProductVariantRequest(string? Sku, decimal Price, int AvailableStocks, List<Guid> OptionValueIds);
public record UpdateProductVariantRequest(string? Sku, decimal Price, int AvailableStocks);
public record UpdateProductOptionRequest(string Name);
public record UpdateProductOptionValueRequest(string Value);