using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.Consumers;

/// <summary>
/// Handles PaymentFailedEvent from Payment Service.
/// Finds all SubOrders for the failed order and publishes SubOrderRejectedEvent
/// for each one, triggering the Saga compensation flow (cancel + release stock + refund).
/// </summary>
public class PaymentFailedConsumer(
    IEfUnitOfWork unitOfWork,
    ILogger<PaymentFailedConsumer> logger)
    : IConsumer<PaymentFailedEvent>
{
    public async Task Consume(ConsumeContext<PaymentFailedEvent> context)
    {
        var orderId = context.Message.OriginalOrderId;
        var reason = context.Message.Reason;
        
        logger.LogInformation(
            "PaymentFailedConsumer: Nhận thông báo thanh toán thất bại cho đơn hàng {OrderId}. Lý do: {Reason}",
            orderId, reason);

        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
            var subOrders = await subOrderRepo.GetAllAsync(
                predicate: s => s.OrderId == orderId && s.Status != SubOrderStatus.Cancelled,
                cancellationToken: context.CancellationToken);

            if (!subOrders.Any())
            {
                logger.LogWarning("PaymentFailedConsumer: Không tìm thấy SubOrder nào cho Order {OrderId}", orderId);
                return;
            }

            foreach (var subOrder in subOrders)
            {
                // Publish SubOrderRejectedEvent → Saga handles compensation (cancel + release stock + refund)
                await context.Publish(new SubOrderRejectedEvent
                {
                    SubOrderId = subOrder.Id,
                    Reason = $"Thanh toán thất bại: {reason}"
                });

                logger.LogInformation(
                    "PaymentFailedConsumer: Đã publish SubOrderRejectedEvent cho SubOrder {SubOrderId}",
                    subOrder.Id);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "PaymentFailedConsumer: Lỗi khi xử lý thanh toán thất bại cho đơn {OrderId}",
                orderId);
            throw; // Let MassTransit retry
        }
    }
}
