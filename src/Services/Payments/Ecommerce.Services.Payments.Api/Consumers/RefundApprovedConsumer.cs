using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using MassTransit;
using Microsoft.Extensions.Logging;

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
                @event.RefundAmount, 
                TransactionReason.OrderRefund, 
                $"Hoàn tiền đơn hàng {@event.SubOrderId} được duyệt bởi cửa hàng."
            );

            if (!result.IsSuccess)
            {
                throw new Exception($"Failed to process wallet refund: {result.Message}");
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
