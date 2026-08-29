using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Services;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Payments.Api.Controllers;

[ApiController]
[Route("api/admin/commission")]
[Authorize(Roles = "Admin")]
public class AdminCommissionController(ICommissionService commissionService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCommission()
    {
        var result = await commissionService.GetPlatformCommissionRateAsync();
        if (!result.IsSuccess)
            return StatusCode(result.GetHttpStatusCode(), new { message = result.Message });

        return Ok(new { ratePercentage = result.Value });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateCommission([FromBody] UpdateCommissionRequest request)
    {
        var result = await commissionService.UpdatePlatformCommissionRateAsync(request.RatePercentage);
        if (!result.IsSuccess)
            return StatusCode(result.GetHttpStatusCode(), new { message = result.Message });

        return Ok(new { message = "Cập nhật tỷ lệ hoa hồng thành công", ratePercentage = result.Value });
    }
}

public record UpdateCommissionRequest(decimal RatePercentage);
