using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using MassTransit;

namespace Ecommerce.Services.Payments.Api.Consumers;

public class RefundApprovedConsumer(
    IWalletService walletService,
    ILogger<RefundApprovedConsumer> logger)
    : IConsumer<RefundApprovedEvent>
{
    public async Task Consume(ConsumeContext<RefundApprovedEvent> context)
    {
        var @event = context.Message;
        logger.LogInformation("Processing RefundApprovedEvent. CustomerId: {CustomerId}, Amount: {Amount}, SubOrderId: {SubOrderId}",
            @event.CustomerId, @event.RefundAmount, @event.SubOrderId);

        try
        {
            var result = await walletService.ProcessRefundAsync(
                @event.CustomerId, 
                @event.RefundRequestId, // Truyền trực tiếp RefundRequestId làm ReferenceId
                @event.CustomerRefundAmount, 
                TransactionReason.OrderRefund, 
                $"Hoàn tiền đơn hàng {@event.SubOrderId} được duyệt bởi cửa hàng."
            );

            if (!result.IsSuccess)
            {
                throw new Exception($"Failed to process wallet refund: {result.Message}");
            }

            // Trừ tiền trực tiếp từ ví của Shop
            var debitResult = await walletService.DebitWalletAsync(
                @event.ShopOwnerUserId,
                @event.RefundRequestId,
                @event.RefundAmount,
                TransactionReason.OrderRefund,
                $"Trừ tiền hoàn đơn hàng {@event.SubOrderId} hoàn trả về ví khách hàng."
            );
            
            if (!debitResult.IsSuccess)
            {
                logger.LogWarning("Không thể trừ tiền từ ví của Shop Owner {@event.ShopOwnerUserId}: {Message}", @event.ShopOwnerUserId, debitResult.Message);
            }

            logger.LogInformation("Successfully processed RefundApprovedEvent for SubOrder {SubOrderId}", @event.SubOrderId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process RefundApprovedEvent for SubOrder {SubOrderId}", @event.SubOrderId);
            throw;
        }
    }
}
