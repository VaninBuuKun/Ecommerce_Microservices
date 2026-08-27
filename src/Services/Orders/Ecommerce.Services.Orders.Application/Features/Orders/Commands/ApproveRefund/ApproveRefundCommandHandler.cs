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
    IPaymentService paymentService,
    ILogger<ApproveRefundCommandHandler> logger)
    : CommandHandler<ApproveRefundCommand>
{
    protected override async Task<Result> HandleCommandAsync(ApproveRefundCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seller {SellerId} approving refund request {RefundRequestId}", command.SellerId, command.RefundRequestId);
        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, long>();
            var refundRepo = unitOfWork.Repository<RefundRequest, long>();

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
            var itemsRepo = unitOfWork.Repository<SubOrderItem, long>();
            var subOrderItems = await itemsRepo.GetAllAsync(i => i.SubOrderId == subOrder.Id, null, cancellationToken);

            // Lấy thông tin vận chuyển của Shop để biết OwnerUserId
            var shopInfoResult = await sellerService.GetShopShippingInfoAsync(refundRequest.ShopId, cancellationToken);
            if (!shopInfoResult.IsSuccess || shopInfoResult.Value == null)
            {
                return Result.Failure("Không lấy được thông tin vận chuyển của cửa hàng.", EErrorCode.NotFound);
            }
            var shopInfo = shopInfoResult.Value;

            // RÀNG BUỘC: Kiểm tra số dư ví điện tử của Shop Owner xem có đủ hoàn trả
            var checkWalletResult = await paymentService.CheckWalletAsync(command.SellerId, refundRequest.RequestedAmount, cancellationToken);
            if (!checkWalletResult.IsSuccess)
            {
                return Result.Failure(checkWalletResult.Message ?? "Ví của người bán không đủ số dư hoặc chưa đăng ký liên kết.", EErrorCode.ValidationErrors);
            }

            // Cập nhật Refund Request
            refundRequest.SellerApprove();
            refundRepo.Update(refundRequest);

            // Cập nhật SubOrder
            subOrder.UpdateSubOrderStatus(SubOrderStatus.Refunded);
            subOrderRepo.Update(subOrder);

            // 1. Publish RefundApprovedEvent để Payment Service cộng tiền vào ví Customer và trừ ví Seller
            await publisher.PublishAsync(new RefundApprovedEvent
            {
                SubOrderId = subOrder.Id,
                RefundRequestId = refundRequest.Id,
                CustomerId = subOrder.CustomerId,
                RefundAmount = refundRequest.RequestedAmount,
                CustomerRefundAmount = subOrder.GrandTotal,
                ShopOwnerUserId = command.SellerId,
            }, cancellationToken);

            // 2. Tạo vận đơn hoàn hàng (Reverse Waybill) bằng cách báo gửi yêu cầu IsReturn
            await publisher.PublishAsync(new CreateShipmentRequest
            {
                SubOrderId = subOrder.Id,
                OrderId = subOrder.OrderId,
                IsReturn = true
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
