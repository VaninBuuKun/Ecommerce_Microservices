using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Shippings.Api.Models.Entities;
using Ecommerce.Services.Shippings.Api.Models.Enums;
using Ecommerce.Services.Shippings.Api.Persistances;
using Ecommerce.Services.Shippings.Api.Models.Interfaces;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Shippings.Api.Consumers;

public class CreateShipmentConsumer(
    IShippingProviderFactory providerFactory,
    SellerGrpc.SellerGrpcClient sellerGrpcClient,   
    ShippingDbContext dbContext,
    ILogger<CreateShipmentConsumer> logger) : IConsumer<CreateShipmentRequest>
{
    public async Task Consume(ConsumeContext<CreateShipmentRequest> context)
    {
        var message = context.Message;
        logger.LogInformation("Creating shipment for SubOrder {SubOrderId}, Order {OrderId}, IsReturn {IsReturn}", message.SubOrderId, message.OrderId, message.IsRefund);

        try
        {
            string senderNameForWaybill = string.Empty;
            string senderPhoneForWaybill = string.Empty;
            string senderAddressForWaybill = string.Empty;
            long senderWardIdForWaybill = 0;

            string recipientNameForWaybill = string.Empty;
            string recipientPhoneForWaybill = string.Empty;
            string recipientAddressForWaybill = string.Empty;
            long recipientWardIdForWaybill = 0;

            int weight = 0;
            int length = 0;
            int width = 0;
            int height = 0;
            decimal codAmountForWaybill = 0;
            long shopId = 0;

            List<CreateWaybillItemRequest> itemsForWaybill;

            if (message.IsRefund)
            {
                // Tìm kiếm shipment gốc đã được tạo trước đó thành công
                var originalShipment = await dbContext.Shipments
                    .FirstOrDefaultAsync(s => s.SubOrderId == message.SubOrderId && s.Status != ShipmentStatus.Failed, context.CancellationToken);

                if (originalShipment == null)
                {
                    logger.LogError("Original shipment not found for return suborder {SubOrderId}", message.SubOrderId);
                    await context.Publish<SubOrderRejectedEvent>(new SubOrderRejectedEvent
                    {
                        SubOrderId = message.SubOrderId,
                        Reason = $"Không tìm thấy vận đơn gốc cho đơn hàng hoàn trả {message.SubOrderId}."
                    });
                    return;
                }

                // Lấy thông tin Shop bằng gRPC
                var shopInfo = await sellerGrpcClient.GetShopShippingInfoAsync(new GetShopShippingInfoRequest
                {
                    ShopId = originalShipment.ShopId
                }, cancellationToken: context.CancellationToken);

                var shopName = !string.IsNullOrWhiteSpace(shopInfo?.RecipientName)
                    ? shopInfo.RecipientName
                    : shopInfo?.ShopName;

                if (shopInfo == null || string.IsNullOrWhiteSpace(shopName) || string.IsNullOrWhiteSpace(shopInfo.Phone) || string.IsNullOrWhiteSpace(shopInfo.AddressLine) || shopInfo.WardId == 0)
                {
                    logger.LogError("Shop {ShopId} has invalid or incomplete shipping information. Cannot return package.", originalShipment.ShopId);
                    await context.Publish<SubOrderRejectedEvent>(new SubOrderRejectedEvent
                    {
                        SubOrderId = message.SubOrderId,
                        Reason = "Thông tin vận chuyển của Cửa hàng không đầy đủ hoặc không hợp lệ. Không thể tạo đơn hoàn trả."
                    });
                    return;
                }

                // Đảo ngược thông tin gửi/nhận
                // Người gửi: Khách hàng (Recipient cũ)
                senderNameForWaybill = originalShipment.RecipientName;
                senderPhoneForWaybill = originalShipment.RecipientPhone;
                senderAddressForWaybill = originalShipment.RecipientAddress;
                senderWardIdForWaybill = originalShipment.RecipientWardId;

                // Người nhận: Shop (thông tin lấy từ shopInfo)
                recipientNameForWaybill = shopName;
                recipientPhoneForWaybill = shopInfo.Phone;
                recipientAddressForWaybill = shopInfo.AddressLine;
                recipientWardIdForWaybill = shopInfo.WardId;

                weight = originalShipment.Weight;
                length = originalShipment.Length;
                width = originalShipment.Width;
                height = originalShipment.Height;
                codAmountForWaybill = 0m;
                shopId = originalShipment.ShopId;

                itemsForWaybill = message.Items.Select(item => new CreateWaybillItemRequest(
                    item.ProductName,
                    item.VariantId.ToString(),
                    item.Quantity,
                    (int)item.UnitPrice,
                    item.ProductImage
                )).ToList();
            }
            else
            {
                var shopInfo = await sellerGrpcClient.GetShopShippingInfoAsync(new GetShopShippingInfoRequest
                {
                    ShopId = message.ShopId
                }, cancellationToken: context.CancellationToken);

                var shopName = !string.IsNullOrWhiteSpace(shopInfo?.RecipientName)
                    ? shopInfo.RecipientName
                    : shopInfo?.ShopName;

                if (shopInfo == null ||
                    string.IsNullOrWhiteSpace(shopName) ||
                    string.IsNullOrWhiteSpace(shopInfo.Phone) ||
                    string.IsNullOrWhiteSpace(shopInfo.AddressLine) ||
                    shopInfo.WardId == 0)
                {
                    logger.LogError("Shop {ShopId} has invalid or incomplete shipping information. Rejecting suborder.", message.ShopId);
                    
                    await context.Publish<SubOrderRejectedEvent>(new SubOrderRejectedEvent
                    {
                        SubOrderId = message.SubOrderId,
                        Reason = "Thông tin vận chuyển của Cửa hàng không đầy đủ hoặc không hợp lệ (Thiếu tên, số điện thoại, địa chỉ hoặc mã phường/xã)."
                    });
                    return;
                }

                senderNameForWaybill = shopName;
                senderPhoneForWaybill = shopInfo.Phone;
                senderAddressForWaybill = shopInfo.AddressLine;
                senderWardIdForWaybill = shopInfo.WardId;

                recipientNameForWaybill = message.RecipientName;
                recipientPhoneForWaybill = message.RecipientPhone;
                recipientAddressForWaybill = message.RecipientAddress;
                recipientWardIdForWaybill = message.RecipientWardId;

                weight = message.Weight;
                length = message.Length;
                width = message.Width;
                height = message.Height;
                codAmountForWaybill = message.CodAmount;
                shopId = message.ShopId;

                itemsForWaybill = message.Items.Select(item => new CreateWaybillItemRequest(
                    item.ProductName,
                    item.VariantId.ToString(),
                    item.Quantity,
                    (int)item.UnitPrice,
                    item.ProductImage
                )).ToList();
            }

            var shippingProvider = providerFactory.GetProvider("GHN"); 

            var waybillResult = await shippingProvider.CreateWaybillAsync(new CreateWaybillRequest(
                message.SubOrderId,
                message.OrderId,
                senderNameForWaybill,
                senderPhoneForWaybill,
                senderAddressForWaybill,
                senderWardIdForWaybill,
                recipientWardIdForWaybill,
                recipientAddressForWaybill,
                recipientNameForWaybill,
                recipientPhoneForWaybill,
                weight,
                length,
                width,
                height,
                codAmountForWaybill,
                itemsForWaybill
            ), context.CancellationToken);

            var shipment = new Shipment
            {
                Id = Guid.NewGuid(),
                SubOrderId = message.SubOrderId,
                OrderId = message.OrderId,
                CustomerId = message.CustomerId,
                ShopId = shopId,
                SenderAddress = senderAddressForWaybill,
                RecipientAddress = recipientAddressForWaybill,
                RecipientName = recipientNameForWaybill,
                RecipientPhone = recipientPhoneForWaybill,
                RecipientWardId = recipientWardIdForWaybill,
                Weight = weight,
                Length = length,
                Width = width,
                Height = height,
                CarrierName = shippingProvider.ProviderName,
                IsRefund = message.IsRefund,
            };

            if (waybillResult.IsSuccess)
            {
                shipment.WaybillCode = waybillResult.Value.WaybillCode;
                shipment.ShippingFee = waybillResult.Value.ShippingFee;
                shipment.ExpectedDeliveryDate = waybillResult.Value.ExpectedDeliveryDate;
                shipment.Status = ShipmentStatus.ReadyToPick;
                shipment.TrackingLogs = $"[{DateTime.UtcNow}] Khởi tạo vận đơn thành công với mã vận đơn {shipment.WaybillCode}.";
                
                dbContext.Shipments.Add(shipment);
                await dbContext.SaveChangesAsync(context.CancellationToken);

                logger.LogInformation("Shipment created successfully. Waybill: {WaybillCode}. Waiting for carrier pickup.", shipment.WaybillCode);
            }
            else
            {
                shipment.Status = ShipmentStatus.Failed;
                shipment.FailureReason = waybillResult.Message;
                dbContext.Shipments.Add(shipment);
                await dbContext.SaveChangesAsync(context.CancellationToken);

                logger.LogError("Failed to create waybill: {Error}", waybillResult.Message);

                await context.Publish<SubOrderRejectedEvent>(new SubOrderRejectedEvent
                {
                    SubOrderId = message.SubOrderId,
                    Reason = $"Tạo vận đơn thất bại: {waybillResult.Message}"
                });
            }
        }
        catch (Exception ex)
        {
            var detailedError = ex.InnerException != null ? $"{ex.Message} -> Inner: {ex.InnerException.Message}" : ex.Message;
            logger.LogError(ex, "Unexpected error in CreateShipmentConsumer: {DetailedError}", detailedError);
            
            await context.Publish<SubOrderRejectedEvent>(new SubOrderRejectedEvent
            {
                SubOrderId = message.SubOrderId,
                Reason = $"Lỗi hệ thống khi khởi tạo vận đơn: {detailedError}"
            });
        }
    }
}