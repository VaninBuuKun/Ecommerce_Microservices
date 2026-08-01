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
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.RejectRefund;

public class RejectRefundCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ISellerService sellerService,
    ILogger<RejectRefundCommandHandler> logger)
    : CommandHandler<RejectRefundCommand>
{
    protected override async Task<Result> HandleCommandAsync(RejectRefundCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seller {SellerId} rejecting refund request {RefundRequestId}", command.SellerId, command.RefundRequestId);
        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
            var refundRepo = unitOfWork.Repository<RefundRequest, Guid>();

            var refundRequest = await refundRepo.GetByIdAsync(command.RefundRequestId, cancellationToken);
            if (refundRequest == null)
            {
                return Result.Failure("Yêu cầu hoàn trả không tồn tại.", EErrorCode.NotFound);
            }

            if (refundRequest.Status != RefundStatus.Pending)
            {
                return Result.Failure("Yêu cầu hoàn trả này đã được xử lý trước đó.", EErrorCode.ValidationErrors);
            }

            if (string.IsNullOrWhiteSpace(command.SellerNote))
            {
                return Result.Failure("Lý do từ chối yêu cầu hoàn trả không được để trống.", EErrorCode.ValidationErrors);
            }

            // Kiểm tra quyền chủ shop
            var validationResult = await sellerService.ValidateShopOwnerAsync(refundRequest.ShopId, command.SellerId, cancellationToken);
            if (!validationResult.IsSuccess || !validationResult.Value)
            {
                return Result.Failure("Bạn không phải là chủ sở hữu cửa hàng này.", EErrorCode.Forbidden);
            }

            var subOrder = await subOrderRepo.GetByIdAsync(refundRequest.SubOrderId, cancellationToken);
            if (subOrder == null)
            {
                return Result.Failure("Đơn hàng không tồn tại.", EErrorCode.NotFound);
            }

            // Cập nhật Refund Request thành Rejected
            refundRequest.Status = RefundStatus.Rejected;
            refundRequest.SellerNote = command.SellerNote.Trim();
            refundRepo.Update(refundRequest);

            // SubOrder quay lại trạng thái Delivered
            subOrder.UpdateSubOrderStatus(SubOrderStatus.Delivered);
            subOrderRepo.Update(subOrder);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Refund request {RefundRequestId} rejected successfully, SubOrder {SubOrderId} reverted to Delivered", refundRequest.Id, subOrder.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error rejecting refund request {RefundRequestId}", command.RefundRequestId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
