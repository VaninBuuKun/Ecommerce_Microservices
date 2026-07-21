using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Shippings.Api.Models.Entities;
using Ecommerce.Services.Shippings.Api.Models.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Shippings.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<WebhooksController> logger) : ControllerBase
{
    [HttpPost("ghn")]
    public async Task<IActionResult> HandleGhnWebhook([FromBody] Dictionary<string, object> ghnData)
    {
        try
        {
            logger.LogInformation("Received GHN shipping webhook: {@GhnData}", ghnData);

            if (!ghnData.TryGetValue("waybill_code", out var waybillCodeObj) || waybillCodeObj == null)
            {
                return BadRequest("Missing waybill_code");
            }

            var waybillCode = waybillCodeObj.ToString()!;
            var shipmentRepo = unitOfWork.Repository<Shipment, Guid>();
            var shipment = await shipmentRepo.FirstOrDefaultAsync(x => x.WaybillCode == waybillCode);

            if (shipment == null)
            {
                logger.LogWarning("Shipment not found for waybill: {WaybillCode}", waybillCode);
                return NotFound($"Shipment not found for waybill: {waybillCode}");
            }

            if (!ghnData.TryGetValue("status", out var statusObj) || statusObj == null)
            {
                return BadRequest("Missing status");
            }

            var status = statusObj.ToString()!.ToLower();
            logger.LogInformation("Updating shipment {WaybillCode} status to {Status}", waybillCode, status);

            switch (status)
            {
                case "picking":
                case "storing":
                    shipment.Status = ShipmentStatus.Picking;
                    shipment.TrackingLogs += $"\n[{DateTime.UtcNow}] Courier is picking up the package.";
                    break;
                
                case "delivering":
                    shipment.Status = ShipmentStatus.InTransit;
                    shipment.TrackingLogs += $"\n[{DateTime.UtcNow}] Package is in transit.";
                    // If Saga didn't transition to Shipping yet:
                    await publisher.PublishAsync(new SubOrderShippedEvent { SubOrderId = shipment.SubOrderId });
                    break;

                case "delivered":
                    shipment.Status = ShipmentStatus.Delivered;
                    shipment.TrackingLogs += $"\n[{DateTime.UtcNow}] Package delivered successfully.";
                    await publisher.PublishAsync(new SubOrderDeliveredEvent { SubOrderId = shipment.SubOrderId });
                    break;

                case "cancelled":
                case "returned":
                    shipment.Status = status == "cancelled" ? ShipmentStatus.Cancelled : ShipmentStatus.Returned;
                    shipment.FailureReason = ghnData.TryGetValue("reason", out var reasonObj) ? reasonObj?.ToString() : "Cancelled by carrier/user";
                    shipment.TrackingLogs += $"\n[{DateTime.UtcNow}] Package rejected/returned. Reason: {shipment.FailureReason}";
                    await publisher.PublishAsync(new SubOrderRejectedEvent { SubOrderId = shipment.SubOrderId, Reason = shipment.FailureReason });
                    break;

                default:
                    logger.LogWarning("Unknown GHN webhook status: {Status}", status);
                    break;
            }

            shipmentRepo.Update(shipment);
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
