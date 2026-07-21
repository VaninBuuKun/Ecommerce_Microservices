using System;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Shippings.Api.Models.Entities;
using Ecommerce.Services.Shippings.Api.Models.Enums;
using Ecommerce.Services.Shippings.Api.Persistances;
using Ecommerce.Services.Shippings.Api.Services;
using MassTransit;
using Microsoft.Extensions.Logging;

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
        logger.LogInformation("Creating shipment for SubOrder {SubOrderId}, Order {OrderId}", message.SubOrderId, message.OrderId);

        try
        {
            // 1. Gọi gRPC lấy thông tin lấy hàng thực tế của Shop
            var shopInfo = await sellerGrpcClient.GetShopShippingInfoAsync(new GetShopShippingInfoRequest
            {
                ShopId = message.ShopId
            }, cancellationToken: context.CancellationToken);

            string senderName = shopInfo.ShopName ?? "Cửa hàng Online";
            string senderPhone = shopInfo.Phone ?? "0987654321";
            string senderAddress = shopInfo.AddressLine ?? "Địa chỉ Shop";
            string senderWardId = shopInfo.WardCode ?? "20002"; // Fallback ward code mặc định

            // 2. Chọn nhà vận chuyển động (mặc định là GHN, có thể mở rộng lấy theo yêu cầu đơn hàng)
            var shippingProvider = providerFactory.GetProvider("GHN"); 

            var waybillResult = await shippingProvider.CreateWaybillAsync(new CreateWaybillRequest(
                message.SubOrderId,
                message.OrderId,
                senderWardId,
                senderName,
                senderPhone,
                senderAddress,
                message.RecipientWardId,
                message.RecipientAddress,
                message.RecipientName,
                message.RecipientPhone,
                message.Weight,
                message.Length,
                message.Width,
                message.Height,
                message.CodAmount
            ), context.CancellationToken);

            var shipment = new Shipment
            {
                Id = Guid.NewGuid(),
                SubOrderId = message.SubOrderId,
                OrderId = message.OrderId,
                SenderAddress = senderAddress,
                RecipientAddress = message.RecipientAddress,
                Weight = message.Weight,
                Length = message.Length,
                Width = message.Width,
                Height = message.Height,
                CarrierName = shippingProvider.ProviderName
            };

            if (waybillResult.IsSuccess)
            {
                shipment.WaybillCode = waybillResult.Value.WaybillCode;
                shipment.ShippingFee = waybillResult.Value.ShippingFee;
                shipment.Status = ShipmentStatus.ReadyToPick;
                shipment.TrackingLogs = $"[Registered] Shipment registered with waybill {shipment.WaybillCode} at {DateTime.UtcNow}";
                
                dbContext.Shipments.Add(shipment);
                await dbContext.SaveChangesAsync(context.CancellationToken);

                logger.LogInformation("Shipment created successfully. Waybill: {WaybillCode}", shipment.WaybillCode);

                // Publish SubOrderShippedEvent to push Saga to Shipping state
                await context.Publish<SubOrderShippedEvent>(new SubOrderShippedEvent
                {
                    SubOrderId = message.SubOrderId
                });
            }
            else
            {
                shipment.Status = ShipmentStatus.Failed;
                shipment.FailureReason = waybillResult.Message;
                dbContext.Shipments.Add(shipment);
                await dbContext.SaveChangesAsync(context.CancellationToken);

                logger.LogError("Failed to create waybill: {Error}", waybillResult.Message);

                // Publish SubOrderRejectedEvent to cancel Saga
                await context.Publish<SubOrderRejectedEvent>(new SubOrderRejectedEvent
                {
                    SubOrderId = message.SubOrderId,
                    Reason = $"Shipping allocation failed: {waybillResult.Message}"
                });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error creating shipment");
            await context.Publish<SubOrderRejectedEvent>(new SubOrderRejectedEvent
            {
                SubOrderId = message.SubOrderId,
                Reason = $"Shipping allocation error: {ex.Message}"
            });
        }
    }
}
