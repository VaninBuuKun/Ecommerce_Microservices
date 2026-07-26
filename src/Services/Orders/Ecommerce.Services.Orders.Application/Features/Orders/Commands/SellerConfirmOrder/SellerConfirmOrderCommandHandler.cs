using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerConfirmOrder;

public class SellerConfirmOrderCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ISellerService sellerService,
    ILogger<SellerConfirmOrderCommandHandler> logger)
    : CommandHandler<SellerConfirmOrderCommand>
{
    protected override async Task<Result> HandleCommandAsync(SellerConfirmOrderCommand command, CancellationToken cancellationToken)
    {
        
        logger.LogInformation("Seller {SellerId} confirming sub-order {SubOrderId}", command.SellerId, command.SubOrderId);
        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
            var subOrder = await subOrderRepo.GetByIdAsync(command.SubOrderId, cancellationToken);
            
            if (subOrder == null)
            {
                return Result.Failure("Đơn hàng không tồn tại", EErrorCode.NotFound);
            }
            
            
            // Call gRPC Seller service to validate if the current user owns the shop
            var validationResult = await sellerService.ValidateShopOwnerAsync(subOrder.ShopId, command.SellerId , cancellationToken);
            if (!validationResult.IsSuccess)
            {
                return Result.Failure(validationResult.Message, EErrorCode.Forbidden);
            }
            
            if (!validationResult.Value)
            {
                return Result.Failure("Bạn không phải là chủ sở hữu cửa hàng này", EErrorCode.Forbidden);
            }

            subOrder.UpdateSubOrderStatus(SubOrderStatus.Processing);
            subOrderRepo.Update(subOrder);

            // 1. Publish event to Outbox first
            await publisher.PublishAsync(new SubOrderConfirmedEvent
            {
                SubOrderId = subOrder.Id,
                OriginalOrderId = subOrder.OrderId,
                ShopId = subOrder.ShopId
            }, cancellationToken);

            // 2. Commit transaction (saves entity state + publishes event outbox message atomically)
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Sub-order {SubOrderId} confirmed successfully and event published", subOrder.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error confirming sub-order {SubOrderId} by seller", command.SubOrderId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
