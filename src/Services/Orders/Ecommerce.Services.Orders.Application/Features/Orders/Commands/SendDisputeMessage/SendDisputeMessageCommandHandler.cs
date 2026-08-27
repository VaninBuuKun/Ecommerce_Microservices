using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SendDisputeMessage;

public class SendDisputeMessageCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<SendDisputeMessageCommandHandler> logger)
    : CommandHandler<SendDisputeMessageCommand>
{
    protected override async Task<Result> HandleCommandAsync(SendDisputeMessageCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("User {SenderUserId} ({SenderRole}) sending message in DisputeThread {DisputeThreadId}", command.SenderUserId, command.SenderRole, command.DisputeThreadId);
        try
        {
            var disputeRepo = unitOfWork.Repository<DisputeThread, long>();
            var thread = await disputeRepo.GetByIdAsync(command.DisputeThreadId, cancellationToken);
            if (thread == null)
            {
                return Result.Failure("Phòng tranh chấp không tồn tại.", EErrorCode.NotFound);
            }

            if (thread.Status != "Active")
            {
                return Result.Failure("Phòng tranh chấp này đã đóng.", EErrorCode.ValidationErrors);
            }

            var attachmentJson = command.AttachmentUrls != null && command.AttachmentUrls.Count > 0
                ? JsonSerializer.Serialize(command.AttachmentUrls)
                : null;

            thread.AddMessage(command.SenderUserId, command.SenderRole, command.Content.Trim(), attachmentJson);
            disputeRepo.Update(thread);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Message added to DisputeThread {DisputeThreadId} successfully", command.DisputeThreadId);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending message in DisputeThread {DisputeThreadId}", command.DisputeThreadId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
