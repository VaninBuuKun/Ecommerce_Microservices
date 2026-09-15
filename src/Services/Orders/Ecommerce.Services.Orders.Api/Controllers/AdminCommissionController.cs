using System.Threading.Tasks;
using BuildingBlocks.Auth;
using Ecommerce.Services.Orders.Application.Features.Commissions.Commands.UpdatePlatformCommission;
using Ecommerce.Services.Orders.Application.Features.Commissions.Queries.GetPlatformCommission;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Orders.Api.Controllers;

[ApiController]
[Route("api/admin/commission")]
[Authorize(Roles = "Admin")]
public class AdminCommissionController(ISender sender, ICurrentUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCommission()
    {
        var result = await sender.Send(new GetPlatformCommissionQuery());
        if (!result.IsSuccess)
            return StatusCode(result.GetHttpStatusCode(), new { message = result.Message });

        return Ok(new { ratePercentage = result.Value });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateCommission([FromBody] UpdateCommissionRequest request)
    {
        var result = await sender.Send(new UpdatePlatformCommissionCommand(request.RatePercentage, userService.UserId));
        if (!result.IsSuccess)
            return StatusCode(result.GetHttpStatusCode(), new { message = result.Message });

        return Ok(new { message = "Cập nhật tỷ lệ hoa hồng thành công", ratePercentage = result.Value });
    }
}

public record UpdateCommissionRequest(decimal RatePercentage);
