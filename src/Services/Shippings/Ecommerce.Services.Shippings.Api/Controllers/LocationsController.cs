using System.Threading.Tasks;
using Ecommerce.Services.Shippings.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Shippings.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController(ILocationService locationService) : ControllerBase
{
    [HttpGet("provinces")]
    public async Task<IActionResult> GetProvinces()
    {
        var result = await locationService.GetProvincesAsync();
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("provinces/{provinceId}/districts")]
    public async Task<IActionResult> GetDistricts(string provinceId)
    {
        var result = await locationService.GetDistrictsAsync(provinceId);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpGet("districts/{districtId}/wards")]
    public async Task<IActionResult> GetWards(string districtId)
    {
        var result = await locationService.GetWardsAsync(districtId);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
