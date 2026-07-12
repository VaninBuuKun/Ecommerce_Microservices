using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Payments.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController(
    IEfUnitOfWork unitOfWork, 
    PaymentGatewayFactory factory, 
    IEventPublisher publisher,
    ILogger<WebhooksController> logger) : ControllerBase
{
    [HttpPost("momo")]
    public async Task<IActionResult> HandleMomoWebhook([FromBody] Dictionary<string, object> momoData)
    {
        try
        {
            logger.LogInformation("Received Momo webhook: {@MomoData}", momoData);
            var momoGateway = factory.GetPaymentGateway("momo");
        
            var stringData = momoData.ToDictionary(k => k.Key, v => v.Value?.ToString() ?? "");
        
            var payment = await unitOfWork.Repository<Payment, Guid>()
                .FirstOrDefaultAsync(p => p.TargetId == Guid.Parse(stringData["orderId"]));
        
            if (payment == null)
            {
                logger.LogWarning("Payment not found for orderId: {OrderId}", stringData["orderId"]);
                return NotFound($"Payment not found for orderId: {stringData["orderId"]}");
            }
            
            if (payment.Status == PaymentStatus.Paid)
            {
                return NoContent();
            }
            
            
            var isValid = await momoGateway.VerifyCallbackAsync(stringData);
            if (!isValid)
            {
                return BadRequest("Signature validation failed");
            }
            
            var orderId = Guid.Parse(stringData["orderId"]);
            var resultCode = int.Parse(stringData["resultCode"]);
        
            if (resultCode == 0)
            {
                payment.Status = PaymentStatus.Paid;
                payment.GatewayTransactionId = stringData["transId"];
                
                // Publish event thanh toán thành công cho saga
                await publisher.PublishAsync(new PaymentSucceededEvent { OrderId = orderId });
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                payment.ErrorMessage = stringData.GetValueOrDefault("message", "Unknown error");
                
                // Publish event thanh toán thất bại cho saga, release stock
                await publisher.PublishAsync(new PaymentFailedEvent 
                { 
                    OrderId = orderId, 
                    Reason = payment.ErrorMessage 
                });
            }
            
            await unitOfWork.SaveChangesAsync();
        
            //Để momo biết đơn hàng xử lý thành công, không gửi ipn nữa.
            return NoContent();
        }
        catch (Exception ex)
        {
            //Nếu không có @ sẽ là MomoData.ToString(), chứa k ra được object json.
            logger.LogInformation(ex, "Error processing Momo webhook: {@MomoData}, Errors: {@Error}", momoData, ex);
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("vnpay")]
    public async Task<IActionResult> HandleVNPayWebhook()
    {
        try
        {
            var query = Request.Query;
            var vnpayData = query.ToDictionary(q => q.Key, q => q.Value.ToString());
            logger.LogInformation("Received VNPay webhook (IPN): {@VNPayData}", vnpayData);
            
            var vnpayGateway = factory.GetPaymentGateway("vnpay");
            
            if (!vnpayData.TryGetValue("vnp_TxnRef", out var txnRef) || string.IsNullOrEmpty(txnRef))
            {
                return BadRequest("Missing vnp_TxnRef");
            }
            
            var orderId = Guid.Parse(txnRef);
            
            var payment = await unitOfWork.Repository<Payment, Guid>()
                .FirstOrDefaultAsync(p => p.TargetId == orderId);
                
            if (payment == null)
            {
                logger.LogWarning("Payment not found for orderId: {OrderId}", orderId);
                return NotFound($"Payment not found for orderId: {orderId}");
            }
            
            if (payment.Status == PaymentStatus.Paid)
            {
                return Ok(new { RspCode = "02", Message = "Order already confirmed" });
            }
            
            var isValid = await vnpayGateway.VerifyCallbackAsync(vnpayData);
            if (!isValid)
            {
                return BadRequest(new { RspCode = "97", Message = "Invalid signature" });
            }
            
            var responseCode = vnpayData.GetValueOrDefault("vnp_ResponseCode", "");
            var transactionStatus = vnpayData.GetValueOrDefault("vnp_TransactionStatus", "");
            
            if (responseCode == "00" && transactionStatus == "00")
            {
                payment.Status = PaymentStatus.Paid;
                payment.GatewayTransactionId = vnpayData.GetValueOrDefault("vnp_TransactionNo", "");
                
                // Publish event thanh toán thành công cho saga
                await publisher.PublishAsync(new PaymentSucceededEvent { OrderId = orderId });
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                payment.ErrorMessage = $"ResponseCode: {responseCode}, TransactionStatus: {transactionStatus}";
                
                // Publish event thanh toán thất bại cho saga, release stock
                await publisher.PublishAsync(new PaymentFailedEvent 
                { 
                    OrderId = orderId, 
                    Reason = payment.ErrorMessage 
                });
            }
            
            await unitOfWork.SaveChangesAsync();
            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing VNPay webhook");
            return StatusCode(500, new { RspCode = "99", Message = "Internal error" });
        }
    }
}