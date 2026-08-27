using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Domain;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetDisputeThread;

public class GetDisputeThreadQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetDisputeThreadQueryHandler> logger)
    : QueryHandler<GetDisputeThreadQuery, DisputeThreadDto>
{
    protected override async Task<Result<DisputeThreadDto>> HandleQueryAsync(GetDisputeThreadQuery query, CancellationToken cancellationToken)
    {
        logger.LogInformation("Getting DisputeThread for RefundRequest {RefundRequestId} by User {UserId}", query.RefundRequestId, query.UserId);
        try
        {
            var disputeRepo = unitOfWork.Repository<DisputeThread, long>();
            var thread = await disputeRepo.FirstOrDefaultAsync(d => d.RefundRequestId == query.RefundRequestId, cancellationToken: cancellationToken);
            if (thread == null)
            {
                return Result<DisputeThreadDto>.Failure("Chưa có phòng tranh chấp cho đơn hoàn trả này.", EErrorCode.NotFound);
            }

            var msgRepo = unitOfWork.Repository<DisputeMessage, long>();
            var messages = await msgRepo.GetAllAsync(m => m.DisputeThreadId == thread.Id, null, cancellationToken);

            var messageDtos = messages
                .OrderBy(m => m.CreatedDate)
                .Select(m => new DisputeMessageDto
                {
                    Id = m.Id,
                    DisputeThreadId = m.DisputeThreadId,
                    SenderUserId = m.SenderUserId,
                    SenderRole = m.SenderRole,
                    Content = m.Content,
                    AttachmentUrls = !string.IsNullOrEmpty(m.AttachmentUrlsJson) 
                        ? JsonSerializer.Deserialize<List<string>>(m.AttachmentUrlsJson) ?? new List<string>()
                        : new List<string>(),
                    CreatedDate = m.CreatedDate
                }).ToList();

            var dto = new DisputeThreadDto
            {
                Id = thread.Id,
                RefundRequestId = thread.RefundRequestId,
                Status = thread.Status,
                DeadlineDate = thread.DeadlineDate,
                ResolvedByAdminId = thread.ResolvedByAdminId,
                ResolutionDecision = thread.ResolutionDecision,
                AdminNote = thread.AdminNote,
                Messages = messageDtos,
                CreatedDate = thread.CreatedDate
            };

            return Result<DisputeThreadDto>.Success(dto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting DisputeThread for RefundRequest {RefundRequestId}", query.RefundRequestId);
            return Result<DisputeThreadDto>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
