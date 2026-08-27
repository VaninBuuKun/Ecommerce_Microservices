using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelOrder;

public class CancelSubOrderCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    IVoucherRepository voucherRepository,
    ILogger<CancelSubOrderCommandHandler> logger)
    : CommandHandler<CancelSubOrderCommand>
{
    protected override async Task<Result> HandleCommandAsync(CancelSubOrderCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Customer {CustomerId} requesting cancellation for SubOrder {SubOrderId}", command.CustomerId, command.SubOrderId);

        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, long>();
            var subOrder = await subOrderRepo.GetByIdAsync(command.SubOrderId, cancellationToken);

            if (subOrder == null)
            {
                return Result.Failure("Đơn hàng không tồn tại", EErrorCode.NotFound);
            }

            if (subOrder.CustomerId != command.CustomerId)
            {
                return Result.Failure("Đơn hàng không thuộc quyền sở hữu của bạn", EErrorCode.Forbidden);
            }

            // Allowed to cancel during: AwaitingPayment, AwaitingConfirmation, Processing
            if (subOrder.Status != SubOrderStatus.AwaitingPayment &&
                subOrder.Status != SubOrderStatus.AwaitingConfirmation &&
                subOrder.Status != SubOrderStatus.Processing)
            {
                return Result.Failure($"Không thể hủy đơn hàng ở trạng thái hiện tại ({subOrder.Status})", EErrorCode.InvalidInput);
            }

            subOrder.UpdateSubOrderStatus(SubOrderStatus.Cancelled);
            subOrderRepo.Update(subOrder);

            // ============================================================
            // ROLLBACK VOUCHER khi hủy SubOrder
            // ============================================================
            await RollbackVouchersAsync(subOrder, cancellationToken);

            long? refundRequestId = null;

            // Nếu đơn hàng đã thanh toán online trước đó -> Tạo bản ghi RefundRequest ở trạng thái AutoApproved
            if (subOrder.IsOnlinePayment && subOrder.Status != SubOrderStatus.AwaitingPayment)
            {
                var refundRepo = unitOfWork.Repository<RefundRequest, long>();
                var refundRequest = new RefundRequest(
                    subOrder.Id,
                    subOrder.CustomerId,
                    subOrder.ShopId,
                    $"Hệ thống tự động hoàn tiền do khách hàng hủy đơn hàng (Lý do: {command.Reason}).",
                    command.Reason,
                    "[]",
                    (decimal)subOrder.GrandTotal,
                    DateTimeOffset.UtcNow.AddDays(2)
                );
                refundRepo.Add(refundRequest);
                refundRequestId = refundRequest.Id;
            }

            // 1. Publish event to Outbox first (Saga will catch this and trigger auto refund if online payment)
            await publisher.PublishAsync(new SubOrderRejectedEvent
            {
                SubOrderId = subOrder.Id,
                Reason = $"Hủy bởi khách hàng: {command.Reason}",
                RefundRequestId = refundRequestId
            }, cancellationToken);

            // 2. Commit transaction (saves entity state + publishes event outbox message atomically)
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("SubOrder {SubOrderId} cancelled successfully by customer", subOrder.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error cancelling sub-order {SubOrderId} by customer", command.SubOrderId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }

    /// <summary>
    /// Hoàn lại UsageCount và xóa VoucherUsage khi SubOrder bị hủy.
    /// - Shop Voucher: rollback ngay lập tức.
    /// - Platform Voucher: rollback chỉ khi TẤT CẢ SubOrder trong Order đều đã Cancelled/Refunded.
    /// </summary>
    private async Task RollbackVouchersAsync(SubOrder cancelledSubOrder, CancellationToken cancellationToken)
    {
        var voucherUsageRepo = unitOfWork.Repository<VoucherUsage, Guid>();

        // --- Rollback Shop Voucher (ngay lập tức) ---
        if (cancelledSubOrder.ShopVoucherId.HasValue)
        {
            long shopVoucherId = cancelledSubOrder.ShopVoucherId.Value;

            await voucherRepository.DecrementUsageAsync(shopVoucherId, cancellationToken);
            logger.LogInformation("Rolled back Shop Voucher {VoucherId} for SubOrder {SubOrderId}",
                shopVoucherId, cancelledSubOrder.Id);

            var shopUsage = await voucherUsageRepo.FirstOrDefaultAsync(
                u => u.SubOrderId == cancelledSubOrder.Id && u.VoucherId == shopVoucherId,
                cancellationToken: cancellationToken);

            if (shopUsage != null)
                voucherUsageRepo.Delete(shopUsage);
        }

        // --- Rollback Platform Voucher (chỉ khi toàn bộ SubOrder đều đã Cancelled/Refunded) ---
        if (cancelledSubOrder.PlatformVoucherId.HasValue)
        {
            long platformVoucherId = cancelledSubOrder.PlatformVoucherId.Value;
            var subOrderRepo = unitOfWork.Repository<SubOrder, long>();

            // Lấy tất cả SubOrder cùng Order (không bao gồm SubOrder đang xử lý — đã bị cancelled ở trên)
            var siblings = await subOrderRepo.GetAllAsync(
                s => s.OrderId == cancelledSubOrder.OrderId && s.Id != cancelledSubOrder.Id,
                cancellationToken: cancellationToken);

            var allOthersDone = siblings.All(s =>
                s.Status == SubOrderStatus.Cancelled ||
                s.Status == SubOrderStatus.Refunded);

            if (allOthersDone)
            {
                await voucherRepository.DecrementUsageAsync(platformVoucherId, cancellationToken);
                logger.LogInformation(
                    "All SubOrders for Order {OrderId} are Cancelled/Refunded — rolled back Platform Voucher {VoucherId}",
                    cancelledSubOrder.OrderId, platformVoucherId);

                // Xóa tất cả VoucherUsage của platform voucher cho order này
                var platformUsages = await voucherUsageRepo.GetAllAsync(
                    u => u.OrderId == cancelledSubOrder.OrderId && u.VoucherId == platformVoucherId,
                    cancellationToken: cancellationToken);

                foreach (var usage in platformUsages)
                    voucherUsageRepo.Delete(usage);
            }
            else
            {
                logger.LogInformation(
                    "SubOrder {SubOrderId} cancelled but other SubOrders still active — Platform Voucher {VoucherId} not rolled back yet.",
                    cancelledSubOrder.Id, platformVoucherId);
            }
        }
    }
}
