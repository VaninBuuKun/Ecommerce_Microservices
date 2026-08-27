using System;
using System.Threading.Tasks;
using Ecommerce.Services.Catalog.Application.Features.Categories.Commands.CreateCategory;
using Ecommerce.Services.Catalog.Application.Features.Categories.Commands.UpdateCategory;
using Ecommerce.Services.Catalog.Application.Features.Categories.Commands.DeleteCategory;
using Ecommerce.Services.Catalog.Application.Features.Categories.Queries.GetCategories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(ISender sender) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var result = await sender.Send(new CreateCategoryCommand(
            request.Name,
            request.Description,
            request.IconUrl,
            request.ParentId
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCategory(long id, [FromBody] UpdateCategoryRequest request)
    {
        var result = await sender.Send(new UpdateCategoryCommand(
            id,
            request.Name,
            request.Description,
            request.ParentId
        ));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCategory(long id)
    {
        var result = await sender.Send(new DeleteCategoryCommand(id));

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var result = await sender.Send(new GetCategoriesQuery());

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}

public record CreateCategoryRequest(string Name, string Description, string? IconUrl, long? ParentId);
public record UpdateCategoryRequest(string Name, string Description, long? ParentId);
