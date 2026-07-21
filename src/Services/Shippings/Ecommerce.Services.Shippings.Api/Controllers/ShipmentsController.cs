using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Shippings.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Shippings.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShipmentsController(IShippingProvider shippingProvider) : ControllerBase
{
    [HttpPost("calculate-fee")]
    public async Task<IActionResult> CalculateFee([FromBody] CalculateFeeRequest request)
    {
        var result = await shippingProvider.CalculateFeeAsync(request);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("create-waybill")]
    public async Task<IActionResult> CreateWaybill([FromBody] CreateWaybillRequest request)
    {
        var result = await shippingProvider.CreateWaybillAsync(request);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("cancel-waybill/{waybillCode}")]
    public async Task<IActionResult> CancelWaybill(string waybillCode)
    {
        var result = await shippingProvider.CancelWaybillAsync(waybillCode);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
