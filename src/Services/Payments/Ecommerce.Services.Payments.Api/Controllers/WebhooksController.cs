using Ecommerce.Services.Payments.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Payments.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController(PaymentGatewayFactory factory, ILogger<WebhooksController> logger) : ControllerBase
{
    [HttpPost("momo")]
    public async Task<IActionResult> HandleMomoWebhook([FromBody] Dictionary<string, object> momoData)
    {
        logger.LogInformation("Received Momo webhook: {@MomoData}", momoData);
        var momoGateway = factory.GetPaymentGateway("momo");
        
        var stringData = momoData.ToDictionary(k => k.Key, v => v.Value?.ToString() ?? "");
        
        var isValid = await momoGateway.VerifyCallbackAsync(stringData);
        if (!isValid)
        {
            return BadRequest("Signature validation failed");
        }
        var orderId = Guid.Parse(stringData["orderId"]);
        var resultCode = int.Parse(stringData["resultCode"]);
    
        if (resultCode == 0)
        {
            Console.WriteLine("Thanh toán thành công");
            //Publish event thanh toán thành công cho saga, cập nhật đơn hàng
        }
        else
        {
            Console.WriteLine($"Thanh toán thất bại{momoData["message"]}");
            //Publish event thanh toán thất bại cho saga, release stock
        }
        
        //Để momo biết đơn hàng xử lý thành công, không gửi ipn nữa.
        return NoContent();
    }
}