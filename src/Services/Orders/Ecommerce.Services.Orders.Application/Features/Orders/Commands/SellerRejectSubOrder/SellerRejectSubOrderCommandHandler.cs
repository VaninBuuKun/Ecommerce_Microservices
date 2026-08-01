using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;
namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerRejectSubOrder;

public class SellerRejectSubOrderCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ISellerService sellerService,
    ILogger<SellerRejectSubOrderCommandHandler> logger)
    : CommandHandler<SellerRejectSubOrderCommand>
{
    protected override async Task<Result> HandleCommandAsync(SellerRejectSubOrderCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seller {SellerId} rejecting sub-order {SubOrderId}", command.SellerId, command.SubOrderId);

        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
            var subOrder = await subOrderRepo.GetByIdAsync(command.SubOrderId, cancellationToken);

            if (subOrder == null)
            {
                return Result.Failure("Đơn hàng không tồn tại", EErrorCode.NotFound);
            }
            
            // Call gRPC Seller service to validate if the current user owns the shop
            var validationResult = await sellerService.ValidateShopOwnerAsync(subOrder.ShopId, command.SellerId, cancellationToken);
            
            if (!validationResult.IsSuccess)
            {
                return Result.Failure(validationResult.Message, EErrorCode.Forbidden);
            }
            
            if (!validationResult.Value)
            {
                return Result.Failure("Bạn không phải là chủ sở hữu cửa hàng này", EErrorCode.Forbidden);
            }

            var originalStatus = subOrder.Status;
            subOrder.UpdateSubOrderStatus(SubOrderStatus.Cancelled);
            subOrderRepo.Update(subOrder);

            Guid? refundRequestId = null;

            // Nếu đơn hàng đã thanh toán online trước đó và chưa giao cho shipper (chưa ở trạng thái Shipping) -> Tạo bản ghi RefundRequest ở trạng thái AutoApproved
            if (subOrder.IsOnlinePayment && originalStatus != SubOrderStatus.AwaitingPayment && originalStatus != SubOrderStatus.Shipping)
            {
                var refundRepo = unitOfWork.Repository<RefundRequest, Guid>();
                var refundRequest = new RefundRequest
                {
                    SubOrderId = subOrder.Id,
                    CustomerId = subOrder.CustomerId,
                    ShopId = subOrder.ShopId,
                    RefundAmount = subOrder.GrandTotal,
                    Reason = $"Hệ thống tự động hoàn tiền do cửa hàng hủy/từ chối đơn hàng (Lý do: {command.Reason}).",
                    Status = RefundStatus.AutoApproved
                };
                refundRepo.Add(refundRequest);
                refundRequestId = refundRequest.Id;
            }

            await publisher.PublishAsync(new SubOrderRejectedEvent
            {
                SubOrderId = subOrder.Id,
                Reason = command.Reason,
                RefundRequestId = refundRequestId
            }, cancellationToken);
            
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Sub-order {SubOrderId} rejected successfully and event published", subOrder.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error rejecting sub-order {SubOrderId} by seller", command.SubOrderId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
