using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CompleteOrder;

public class CompleteSubOrderCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<CompleteSubOrderCommandHandler> logger)
    : CommandHandler<CompleteSubOrderCommand>
{
    protected override async Task<Result> HandleCommandAsync(CompleteSubOrderCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Customer {CustomerId} completing SubOrder {SubOrderId}", command.CustomerId, command.SubOrderId);

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
            
            if (subOrder.Status != SubOrderStatus.Delivered)
            {
                return Result.Failure($"Không thể hoàn tất đơn hàng khi chưa được giao (Trạng thái hiện tại: {subOrder.Status})", EErrorCode.InvalidInput);
            }

            subOrder.UpdateSubOrderStatus(SubOrderStatus.Completed);
            subOrderRepo.Update(subOrder);

            var itemRepo = unitOfWork.Repository<SubOrderItem, long>();
            var items = await itemRepo.GetAllAsync(i => i.SubOrderId == subOrder.Id, null, cancellationToken);

            await publisher.PublishAsync(new SubOrderCompletedEvent
            {
                SubOrderId = subOrder.Id,
                ShopId = subOrder.ShopId,
                CustomerId = subOrder.CustomerId,
                TotalAmount = subOrder.GrandTotal,
                PlatformDiscount = subOrder.PlatformDiscount,
                CommissionRate = subOrder.CommissionRate,
                CommissionFee = subOrder.CommissionFee,
                NetRevenue = subOrder.NetRevenue,
                ShippingFee = subOrder.ShippingFee,
                Items = items.Select(i => new SubOrderCompletedItemContract
                {
                    VariantId = i.VariantId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    ProductName = i.ProductName,
                    ThumbnailUrl = i.ThumbnailUrl
                }).ToList()
            }, cancellationToken);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("SubOrder {SubOrderId} marked as Completed by customer and SubOrderCompletedEvent published", subOrder.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error completing sub-order {SubOrderId} by customer", command.SubOrderId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
