using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Payments.Api.Consumers;

public class RefundSubOrderConsumer(
    IWalletService walletService,
    ILogger<RefundSubOrderConsumer> logger)
    : IConsumer<RefundSubOrderBeforeDeliveredRequest>
{
    public async Task Consume(ConsumeContext<RefundSubOrderBeforeDeliveredRequest> context)
    {
        var request = context.Message;
        logger.LogInformation("Processing RefundSubOrderBeforeDeliveredRequest. CustomerId: {CustomerId}, Amount: {Amount}, SubOrderId: {SubOrderId}, RefundRequestId: {RefundRequestId}",
            request.CustomerId, request.RefundAmount, request.SubOrderId, request.RefundRequestId);

        try
        {
            var result = await walletService.ProcessRefundAsync(
                request.CustomerId,
                request.RefundRequestId, // Truyền trực tiếp RefundRequestId làm ReferenceId
                request.RefundAmount,
                TransactionReason.RefundRejection,
                $"Hoàn tiền online đơn hàng {request.SubOrderId} bị hủy trước khi giao. Lý do: {request.Reason}"
            );

            if (!result.IsSuccess)
            {
                throw new Exception($"Failed to process wallet refund: {result.Message}");
            }

            logger.LogInformation("Successfully processed RefundSubOrderBeforeDeliveredRequest. Credited {Amount} to Customer {CustomerId}",
                request.RefundAmount, request.CustomerId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process RefundSubOrderBeforeDeliveredRequest for SubOrder {SubOrderId}", request.SubOrderId);
            throw;
        }
    }
}
