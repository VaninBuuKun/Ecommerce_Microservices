using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CreateRefund;

public class CreateRefundCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<CreateRefundCommandHandler> logger)
    : CommandHandler<CreateRefundCommand, RefundRequestDto>
{
    protected override async Task<Result<RefundRequestDto>> HandleCommandAsync(CreateRefundCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating refund request for SubOrder {SubOrderId} by Customer {CustomerId}", command.SubOrderId, command.CustomerId);
        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
            var refundRepo = unitOfWork.Repository<RefundRequest, Guid>();

            var subOrder = await subOrderRepo.GetByIdAsync(command.SubOrderId, cancellationToken);
            if (subOrder == null)
            {
                return Result<RefundRequestDto>.Failure("Đơn hàng không tồn tại.", EErrorCode.NotFound);
            }

            if (subOrder.CustomerId != command.CustomerId)
            {
                return Result<RefundRequestDto>.Failure("Bạn không có quyền yêu cầu hoàn trả cho đơn hàng này.", EErrorCode.Forbidden);
            }

            if (subOrder.Status != SubOrderStatus.Delivered)
            {
                return Result<RefundRequestDto>.Failure("Chỉ được yêu cầu hoàn tiền cho các đơn hàng đã được giao thành công.", EErrorCode.ValidationErrors);
            }

            if (!subOrder.DeliveredDate.HasValue)
            {
                return Result<RefundRequestDto>.Failure("Thông tin ngày giao hàng không hợp lệ.", EErrorCode.ValidationErrors);
            }

            if (subOrder.DeliveredDate.Value.AddDays(7) < DateTimeOffset.UtcNow)
            {
                return Result<RefundRequestDto>.Failure("Đã quá thời hạn 7 ngày cho phép yêu cầu hoàn trả kể từ ngày giao hàng.", EErrorCode.ValidationErrors);
            }

            // Kiểm tra xem đã có refund request nào chưa
            var existingRefunds = await refundRepo.GetAllAsync(r => r.SubOrderId == command.SubOrderId, null, cancellationToken);
            if (existingRefunds.Any())
            {
                return Result<RefundRequestDto>.Failure("Đơn hàng này đã được tạo yêu cầu hoàn tiền trước đó. Mỗi đơn hàng chỉ được tạo tối đa 1 yêu cầu.", EErrorCode.RecordAlreadyExists);
            }

            // Tạo RefundRequest
            var refundRequest = new RefundRequest
            {
                SubOrderId = subOrder.Id,
                CustomerId = command.CustomerId,
                ShopId = subOrder.ShopId,
                RefundAmount = subOrder.GrandTotal, // Hoàn trả toàn bộ số tiền thanh toán (bao gồm ship hoặc theo chính sách)
                Reason = command.Reason.Trim(),
                Status = RefundStatus.Pending
            };
            refundRepo.Add(refundRequest);

            // Cập nhật trạng thái SubOrder thành Returning
            subOrder.UpdateSubOrderStatus(SubOrderStatus.Returning);
            subOrderRepo.Update(subOrder);

            // Publish event thông báo trạng thái đơn hàng thay đổi
            await publisher.PublishAsync(new SubOrderStatusChangedEvent
            {
                SubOrderId = subOrder.Id,
                Status = SubOrderStatus.Returning.ToString()
            }, cancellationToken);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Refund request {RefundRequestId} created successfully for SubOrder {SubOrderId}", refundRequest.Id, subOrder.Id);

            var dto = new RefundRequestDto
            {
                Id = refundRequest.Id,
                SubOrderId = refundRequest.SubOrderId,
                CustomerId = refundRequest.CustomerId,
                ShopId = refundRequest.ShopId,
                RefundAmount = refundRequest.RefundAmount,
                Reason = refundRequest.Reason,
                Status = refundRequest.Status.ToString(),
                CreatedDate = refundRequest.CreatedDate
            };

            return Result<RefundRequestDto>.Success(dto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating refund request for SubOrder {SubOrderId}", command.SubOrderId);
            return Result<RefundRequestDto>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
