using Ecommerce.Services.Catalog.Application.Features.Storage.Queries.GenerateUploadUrl;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediasController(ISender sender) : ControllerBase
{
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
}