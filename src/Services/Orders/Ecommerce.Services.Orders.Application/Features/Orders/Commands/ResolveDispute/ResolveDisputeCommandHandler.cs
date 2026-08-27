using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.ResolveDispute;

public class ResolveDisputeCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<ResolveDisputeCommandHandler> logger)
    : CommandHandler<ResolveDisputeCommand>
{
    protected override async Task<Result> HandleCommandAsync(ResolveDisputeCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Admin {AdminUserId} resolving DisputeThread {DisputeThreadId} with decision ApproveRefund={ApproveRefund}", command.AdminUserId, command.DisputeThreadId, command.ApproveRefund);
        try
        {
            var disputeRepo = unitOfWork.Repository<DisputeThread, long>();
            var refundRepo = unitOfWork.Repository<RefundRequest, long>();
            var subOrderRepo = unitOfWork.Repository<SubOrder, long>();

            var thread = await disputeRepo.GetByIdAsync(command.DisputeThreadId, cancellationToken);
            if (thread == null)
            {
                return Result.Failure("Phòng tranh chấp không tồn tại.", EErrorCode.NotFound);
            }

            if (thread.Status != "Active")
            {
                return Result.Failure("Phòng tranh chấp này đã được giải quyết hoặc hết hạn.", EErrorCode.ValidationErrors);
            }

            var refundRequest = await refundRepo.GetByIdAsync(thread.RefundRequestId, cancellationToken);
            if (refundRequest == null)
            {
                return Result.Failure("Đơn yêu cầu hoàn trả liên kết không tồn tại.", EErrorCode.NotFound);
            }

            var subOrder = await subOrderRepo.GetByIdAsync(refundRequest.SubOrderId, cancellationToken);
            if (subOrder == null)
            {
                return Result.Failure("Đơn hàng liên kết không tồn tại.", EErrorCode.NotFound);
            }

            var decisionStr = command.ApproveRefund ? "AdminApproved" : "AdminRejected";

            // 1. Cập nhật phòng khiếu nại
            thread.Resolve(command.AdminUserId, decisionStr, command.AdminNote);
            disputeRepo.Update(thread);

            // 2. Cập nhật RefundRequest
            refundRequest.ResolveByAdmin(command.ApproveRefund);
            refundRepo.Update(refundRequest);

            if (command.ApproveRefund)
            {
                // Admin phán quyết hoàn tiền ➔ Chuyển trạng thái SubOrder sang Refunded & bắn event hoàn tiền
                subOrder.UpdateSubOrderStatus(SubOrderStatus.Refunded);
                subOrderRepo.Update(subOrder);

                await publisher.PublishAsync(new RefundApprovedEvent
                {
                    SubOrderId = subOrder.Id,
                    RefundRequestId = refundRequest.Id,
                    CustomerId = subOrder.CustomerId,
                    RefundAmount = refundRequest.RequestedAmount,
                    CustomerRefundAmount = subOrder.GrandTotal,
                    ShopOwnerUserId = refundRequest.ShopId
                }, cancellationToken);
            }
            else
            {
                // Admin bác đơn khiếu nại ➔ SubOrder quay lại Delivered
                subOrder.UpdateSubOrderStatus(SubOrderStatus.Delivered);
                subOrderRepo.Update(subOrder);
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("DisputeThread {DisputeThreadId} resolved successfully by Admin {AdminUserId}", command.DisputeThreadId, command.AdminUserId);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error resolving DisputeThread {DisputeThreadId}", command.DisputeThreadId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
