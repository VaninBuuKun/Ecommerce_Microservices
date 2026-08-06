using System;
using System.Threading.Tasks;
using Ecommerce.Services.Catalog.Application.Features.Categories.Commands.CreateCategory;
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

public record CreateCategoryRequest(string Name, string Description, string? IconUrl, Guid? ParentId);
