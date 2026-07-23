using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelOrder;

public class CancelSubOrderCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<CancelSubOrderCommandHandler> logger)
    : CommandHandler<CancelSubOrderCommand>
{
    protected override async Task<Result> HandleCommandAsync(CancelSubOrderCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Customer {CustomerId} requesting cancellation for SubOrder {SubOrderId}", command.CustomerId, command.SubOrderId);

        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
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

            // 1. Publish event to Outbox first
            await publisher.PublishAsync(new SubOrderRejectedEvent
            {
                SubOrderId = subOrder.Id,
                Reason = $"Hủy bởi khách hàng: {command.Reason}"
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
}
