using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Shippings.Api.Models.Entities;
using Ecommerce.Services.Shippings.Api.Models.Enums;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Shippings.Api.Controllers;

[ApiController]
[Route("api/shipping-[controller]")]
public class WebhooksController(
    IEfUnitOfWork unitOfWork,
    IPublishEndpoint publisher,
    ILogger<WebhooksController> logger) : ControllerBase
{
    [HttpPost("ghn")]
    public async Task<IActionResult> HandleGhnWebhook([FromBody] Dictionary<string, object> ghnData)
    {
        try
        {
            logger.LogInformation("Received GHN shipping webhook: {@GhnData}", ghnData);

            string? waybillCode = null;
            if (ghnData.TryGetValue("OrderCode", out var orderCodeObj) && orderCodeObj != null)
            {
                waybillCode = orderCodeObj.ToString();
            }
            else if (ghnData.TryGetValue("waybill_code", out var waybillCodeObj) && waybillCodeObj != null)
            {
                waybillCode = waybillCodeObj.ToString();
            }

            if (string.IsNullOrEmpty(waybillCode))
            {
                return BadRequest("Missing waybill_code or OrderCode");
            }

            var shipmentRepo = unitOfWork.Repository<Shipment, Guid>();
            var shipment = await shipmentRepo.FirstOrDefaultAsync(x => x.WaybillCode == waybillCode);

            if (shipment == null)
            {
                logger.LogWarning("Shipment not found for waybill: {WaybillCode}", waybillCode);
                return NotFound($"Shipment not found for waybill: {waybillCode}");
            }

            string? status = null;
            if (ghnData.TryGetValue("Status", out var statusObj) && statusObj != null)
            {
                status = statusObj.ToString()?.ToLower();
            }
            else if (ghnData.TryGetValue("status", out var statusObjSnake) && statusObjSnake != null)
            {
                status = statusObjSnake.ToString()?.ToLower();
            }

            if (string.IsNullOrEmpty(status))
            {
                return BadRequest("Missing status");
            }

            ShipmentStatus targetStatus;
            string logMessage;
            IIntegrationEvent ? eventToPublish = null;
            string? failureReason = null;

            switch (status)
            {
                case "storing":
                    targetStatus = ShipmentStatus.Picking;
                    logMessage = "Shipper đang đến lấy hàng.";
                    break;
                
                case "delivering":
                    targetStatus = ShipmentStatus.InTransit;
                    logMessage = "Hàng đang được vận chuyển.";
                    eventToPublish = new SubOrderShippedEvent 
                    { 
                        SubOrderId = shipment.SubOrderId,
                        OrderId = shipment.OrderId,
                        CustomerId = shipment.CustomerId
                    };
                    break;
                
                case "delivered":
                    targetStatus = ShipmentStatus.Delivered;
                    logMessage = "Hàng đã được giao thành công.";
                    eventToPublish = new SubOrderDeliveredEvent { SubOrderId = shipment.SubOrderId };
                    break;

                // case "cancelled":
                // case "returned":
                //     targetStatus = status == "cancelled" ? ShipmentStatus.Cancelled : ShipmentStatus.Returned;
                //     failureReason = ghnData.TryGetValue("reason", out var reasonObj) ? reasonObj?.ToString() : "Cancelled by carrier/user";
                //     logMessage = $"Package rejected/returned. Reason: {failureReason}";
                //     eventToPublish = new SubOrderRejectedEvent { SubOrderId = shipment.SubOrderId, Reason = failureReason };
                //     break;

                default:
                    logger.LogWarning("Unknown GHN webhook status: {Status}", status);
                    return Ok();
            }

            // 1. Kiểm tra trạng thái kết thúc: Nếu đơn đã hoàn thành/hủy/hoàn hàng thì chặn mọi thay đổi phía sau
            if (shipment.Status == ShipmentStatus.Delivered || 
                shipment.Status == ShipmentStatus.Cancelled || 
                shipment.Status == ShipmentStatus.Returned)
            {
                logger.LogWarning("Shipment {WaybillCode} is already in terminal status {CurrentStatus}. Ignoring incoming status {TargetStatus}", 
                    waybillCode, shipment.Status, targetStatus);
                return NoContent();
            }

            // 2. Chặn trường hợp trạng thái bị lùi ngược thời gian (Out-of-order backward)
            if (shipment.Status == ShipmentStatus.InTransit && targetStatus == ShipmentStatus.Picking)
            {
                logger.LogWarning("Received backward status {TargetStatus} for shipment {WaybillCode} which is already {CurrentStatus}. Ignoring.", 
                    targetStatus, waybillCode, shipment.Status);
                return NoContent();
            }

            // 3. Kiểm tra trùng lặp: Nếu status hiện tại đã giống hệt targetStatus thì bỏ qua
            if (shipment.Status == targetStatus)
            {
                logger.LogInformation("Webhook status {Status} is identical to current shipment status. Skipping update for waybill: {WaybillCode}", 
                    status, waybillCode);
                return NoContent();
            }

            logger.LogInformation("Updating shipment {WaybillCode} status from {OldStatus} to {NewStatus}", waybillCode, shipment.Status, targetStatus);

            shipment.Status = targetStatus;
            shipment.TrackingLogs += $"\n[{DateTime.UtcNow}] {logMessage}";
            
            if (failureReason != null)
            {
                shipment.FailureReason = failureReason;
            }
            shipmentRepo.Update(shipment);
            
            if (eventToPublish != null)
            {
                await publisher.Publish((object)eventToPublish);
            }
            
            await unitOfWork.SaveChangesAsync();
            
            return NoContent();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing GHN webhook");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
