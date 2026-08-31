using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Payments.Api.Controllers;

[ApiController]
[Route("api/[controller]s")]
public class PaymentController(IPaymentMethodService paymentMethodService, IPaymentService paymentService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest paymentRequest)
    {
        var result = await paymentService.ProcessPayment(paymentRequest);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
    
    [HttpGet("methods")]
    public async Task<IActionResult> GetPaymentMethods()
    {
        var result =  await paymentMethodService.GetPaymentMethods();

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPost("methods")]
    public async Task<IActionResult> CreatePaymentMethod([FromBody] CreatePaymentMethodRequest paymentMethod)
    {
        var result =  await paymentMethodService.CreateNewPaymentMethod(paymentMethod);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("methods/{id:long}")]
    public async Task<IActionResult> UpdatePaymentMethod(long id, [FromBody] UpdatePaymentMethodRequest request)
    {
        var result = await paymentMethodService.UpdatePaymentMethod(id, request);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }

    [HttpPut("methods/{id:long}/toggle")]
    public async Task<IActionResult> TogglePaymentMethodStatus(long id)
    {
        var result = await paymentMethodService.TogglePaymentMethodStatus(id);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return StatusCode(result.GetHttpStatusCode(), result.Message);
    }
}
