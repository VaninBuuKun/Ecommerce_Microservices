using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.EscalateToDispute;

public class EscalateToDisputeCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<EscalateToDisputeCommandHandler> logger)
    : CommandHandler<EscalateToDisputeCommand>
{
    protected override async Task<Result> HandleCommandAsync(EscalateToDisputeCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Customer {CustomerId} escalating RefundRequest {RefundRequestId} to Dispute Center", command.CustomerId, command.RefundRequestId);
        try
        {
            var refundRepo = unitOfWork.Repository<RefundRequest, long>();
            var disputeRepo = unitOfWork.Repository<DisputeThread, long>();

            var refundRequest = await refundRepo.GetByIdAsync(command.RefundRequestId, cancellationToken);
            if (refundRequest == null)
            {
                return Result.Failure("Yêu cầu hoàn trả không tồn tại.", EErrorCode.NotFound);
            }

            if (refundRequest.CustomerId != command.CustomerId)
            {
                return Result.Failure("Bạn không phải là người tạo yêu cầu hoàn trả này.", EErrorCode.Forbidden);
            }

            if (refundRequest.Status != RefundStatus.SellerRejected && refundRequest.Status != RefundStatus.Pending)
            {
                return Result.Failure("Chỉ được gửi khiếu nại lên Admin đối với đơn đang chờ hoặc bị Shop từ chối.", EErrorCode.ValidationErrors);
            }

            // Đổi trạng thái sang EscalatedToDispute
            refundRequest.EscalateToDispute();
            refundRepo.Update(refundRequest);

            // Kiểm tra xem đã có DisputeThread chưa
            var existingThread = await disputeRepo.FirstOrDefaultAsync(d => d.RefundRequestId == refundRequest.Id, cancellationToken: cancellationToken);
            if (existingThread == null)
            {
                // Tạo phòng khiếu nại 48h
                var deadline = DateTimeOffset.UtcNow.AddHours(48);
                var thread = new DisputeThread(refundRequest.Id, deadline);
                
                // Thêm tin nhắn khởi tạo nếu có lý do note
                thread.AddMessage(
                    command.CustomerId,
                    "Customer",
                    string.IsNullOrWhiteSpace(command.ReasonNote) 
                        ? $"Khách hàng đã yêu cầu Admin can thiệp khiếu nại (Lý do ban đầu: {refundRequest.Reason})."
                        : $"Khách hàng gửi khiếu nại lên Admin: {command.ReasonNote.Trim()}"
                );

                disputeRepo.Add(thread);
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("RefundRequest {RefundRequestId} successfully escalated to Dispute Thread", refundRequest.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error escalating RefundRequest {RefundRequestId} to Dispute Thread", command.RefundRequestId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
