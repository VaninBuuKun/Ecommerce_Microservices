using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.ApproveRefund;

public class ApproveRefundCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ISellerService sellerService,
    ILogger<ApproveRefundCommandHandler> logger)
    : CommandHandler<ApproveRefundCommand>
{
    protected override async Task<Result> HandleCommandAsync(ApproveRefundCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seller {SellerId} approving refund request {RefundRequestId}", command.SellerId, command.RefundRequestId);
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

            // Nạp các sub-order items để phục vụ việc hoàn kho
            var itemsRepo = unitOfWork.Repository<SubOrderItem, Guid>();
            var subOrderItems = await itemsRepo.GetAllAsync(i => i.SubOrderId == subOrder.Id, null, cancellationToken);

            // Cập nhật Refund Request
            refundRequest.Status = RefundStatus.Approved;
            refundRequest.SellerNote = command.SellerNote?.Trim();
            refundRepo.Update(refundRequest);

            // Cập nhật SubOrder
            subOrder.UpdateSubOrderStatus(SubOrderStatus.Refunded);
            subOrderRepo.Update(subOrder);

            // 1. Publish RefundApprovedEvent để Payment Service cộng tiền vào ví Customer
            await publisher.PublishAsync(new RefundApprovedEvent
            {
                SubOrderId = subOrder.Id,
                RefundRequestId = refundRequest.Id,
                CustomerId = subOrder.CustomerId,
                RefundAmount = refundRequest.RefundAmount
            }, cancellationToken);

             if (subOrderItems.Any())
            {
                await publisher.PublishAsync(new ReleaseStocksRequest
                {
                    OrderId = subOrder.OrderId,
                    VariantItems = subOrderItems.Select(x => new VariantStockData
                    {
                        VariantId = x.VariantId,
                        Quantity = x.Quantity
                    }).ToList()
                }, cancellationToken);
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Refund request {RefundRequestId} approved successfully, money refund & stock release events published", refundRequest.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error approving refund request {RefundRequestId}", command.RefundRequestId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
