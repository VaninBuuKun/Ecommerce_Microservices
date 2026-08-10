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

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelRefund;

public class CancelRefundCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<CancelRefundCommandHandler> logger)
    : CommandHandler<CancelRefundCommand>
{
    protected override async Task<Result> HandleCommandAsync(CancelRefundCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Customer {CustomerId} is withdrawing refund request {RefundRequestId}", command.CustomerId, command.RefundRequestId);
        try
        {
            var refundRepo = unitOfWork.Repository<RefundRequest, Guid>();
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();

            var refundRequest = await refundRepo.GetByIdAsync(command.RefundRequestId, cancellationToken);
            if (refundRequest == null)
            {
                return Result.Failure("Yêu cầu hoàn tiền không tồn tại hoặc đã được xử lý.", EErrorCode.NotFound);
            }

            if (refundRequest.CustomerId != command.CustomerId)
            {
                return Result.Failure("Bạn không có quyền rút yêu cầu hoàn trả này.", EErrorCode.Forbidden);
            }

            if (refundRequest.Status != RefundStatus.Pending)
            {
                return Result.Failure("Chỉ được phép rút các yêu cầu hoàn tiền đang ở trạng thái chờ duyệt (Pending).", EErrorCode.ValidationErrors);
            }

            var subOrder = await subOrderRepo.GetByIdAsync(refundRequest.SubOrderId, cancellationToken);
            if (subOrder == null)
            {
                return Result.Failure("Đơn hàng liên kết không tồn tại.", EErrorCode.NotFound);
            }

            // Xóa RefundRequest khỏi cơ sở dữ liệu
            refundRepo.Delete(refundRequest);

            // Cập nhật lại trạng thái SubOrder từ Returning về Delivered
            subOrder.UpdateSubOrderStatus(SubOrderStatus.Delivered);
            subOrderRepo.Update(subOrder);

            // Bắn event cập nhật trạng thái đơn hàng để Saga / Shipping cập nhật đồng bộ
            await publisher.PublishAsync(new SubOrderStatusChangedEvent
            {
                SubOrderId = subOrder.Id,
                Status = SubOrderStatus.Delivered.ToString()
            }, cancellationToken);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Refund request {RefundRequestId} successfully withdrawn. SubOrder {SubOrderId} set back to Delivered status", command.RefundRequestId, subOrder.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error withdrawing refund request {RefundRequestId}", command.RefundRequestId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
