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
                return BadRequest("Thiếu mã vận đơn (waybill_code hoặc OrderCode).");
            }

            var shipmentRepo = unitOfWork.Repository<Shipment, Guid>();
            var shipment = await shipmentRepo.FirstOrDefaultAsync(x => x.WaybillCode == waybillCode);

            if (shipment == null)
            {
                logger.LogWarning("Shipment not found for waybill: {WaybillCode}", waybillCode);
                return NotFound($"Không tìm thấy thông tin vận chuyển cho mã vận đơn: {waybillCode}");
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
                return BadRequest("Thiếu trạng thái đơn hàng (status).");
            }

            ShipmentStatus targetStatus;
            string logMessage;
            IIntegrationEvent? eventToPublish = null;
            string? failureReason = null;

            switch (status)
            {
                case "ready_to_pick":
                case "readytopick":
                case "storing":
                case "picking":
                    targetStatus = ShipmentStatus.ReadyToPick;
                    logMessage = "Shipper đang lấy hàng từ Shop.";
                    break;

                case "delivering":
                case "in_transit":
                case "intransit":
                case "transporting":
                    targetStatus = ShipmentStatus.InTransit;
                    logMessage = "Kiện hàng đang được vận chuyển.";
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

                case "cancel":
                case "cancelled":
                    targetStatus = ShipmentStatus.Cancelled;
                    failureReason = ghnData.TryGetValue("reason", out var cancelReasonObj) ? cancelReasonObj?.ToString() : "Đơn hàng bị hủy";
                    logMessage = $"Đơn hàng đã bị hủy. Lý do: {failureReason}";
                    eventToPublish = new SubOrderRejectedEvent { SubOrderId = shipment.SubOrderId, Reason = failureReason };
                    break;

                case "return":
                case "returned":
                case "return_transporting":
                    targetStatus = ShipmentStatus.Returned;
                    failureReason = ghnData.TryGetValue("reason", out var returnReasonObj) ? returnReasonObj?.ToString() : "Hàng trả về cho cửa hàng";
                    logMessage = $"Bưu kiện bị hoàn trả. Lý do: {failureReason}";
                    eventToPublish = new SubOrderRejectedEvent { SubOrderId = shipment.SubOrderId, Reason = failureReason };
                    break;

                default:
                    logger.LogWarning("Unknown GHN webhook status: {Status}", status);
                    return Ok();
            }

            // 1. Kiểm tra trạng thái kết thúc (Terminal states): Đã giao thành công / Đã hủy / Hoàn trả / Thất bại
            if (shipment.Status == ShipmentStatus.Delivered || 
                shipment.Status == ShipmentStatus.Cancelled || 
                shipment.Status == ShipmentStatus.Returned ||
                shipment.Status == ShipmentStatus.Failed)
            {
                logger.LogWarning("Shipment {WaybillCode} is already in terminal status {CurrentStatus}. Ignoring incoming status {TargetStatus}", 
                    waybillCode, shipment.Status, targetStatus);
                return BadRequest($"Vận đơn {waybillCode} đã ở trạng thái kết thúc ({shipment.Status}), không thể cập nhật thêm.");
            }

            // 2. Bỏ qua nếu trùng trạng thái hiện tại
            if (shipment.Status == targetStatus)
            {
                logger.LogInformation("Webhook status {Status} is identical to current shipment status. Skipping update for waybill: {WaybillCode}", 
                    status, waybillCode);
                return NoContent();
            }

            // 3. Thứ tự chuyển đổi bắt buộc: ReadyToPick (Chờ lấy hàng) -> InTransit (Đang vận chuyển) -> Delivered (Giao thành công)
            if (targetStatus == ShipmentStatus.InTransit && shipment.Status != ShipmentStatus.ReadyToPick)
            {
                logger.LogWarning("Invalid transition: Cannot move to InTransit from {CurrentStatus} for shipment {WaybillCode}", 
                    shipment.Status, waybillCode);
                return BadRequest($"Chỉ có thể chuyển sang 'Đang vận chuyển' khi đơn hàng ở trạng thái 'Chờ lấy hàng'.");
            }

            if (targetStatus == ShipmentStatus.Delivered && shipment.Status != ShipmentStatus.InTransit)
            {
                logger.LogWarning("Invalid transition: Cannot move to Delivered from {CurrentStatus} for shipment {WaybillCode}", 
                    shipment.Status, waybillCode);
                return BadRequest($"Chỉ có thể chuyển sang 'Giao hàng thành công' khi đơn hàng ở trạng thái 'Đang vận chuyển'.");
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
            return StatusCode(500, $"Lỗi hệ thống nội bộ: {ex.Message}");
        }
    }
}