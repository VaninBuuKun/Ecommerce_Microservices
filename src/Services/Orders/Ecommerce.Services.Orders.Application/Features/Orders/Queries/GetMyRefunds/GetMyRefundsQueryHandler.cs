using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Domain;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetMyRefunds;

public class GetMyRefundsQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetMyRefundsQueryHandler> logger)
    : QueryHandler<GetMyRefundsQuery, List<RefundRequestDto>>
{
    protected override async Task<Result<List<RefundRequestDto>>> HandleQueryAsync(GetMyRefundsQuery query, CancellationToken cancellationToken)
    {
        logger.LogInformation("Getting refund requests for Customer {CustomerId}", query.CustomerId);
        try
        {
            var refundRepo = unitOfWork.Repository<RefundRequest, Guid>();
            var refunds = await refundRepo.GetAllAsync(r => r.CustomerId == query.CustomerId, null, cancellationToken);
            
            var dtos = refunds
                .OrderByDescending(r => r.CreatedDate)
                .Select(r => new RefundRequestDto
                {
                    Id = r.Id,
                    SubOrderId = r.SubOrderId,
                    CustomerId = r.CustomerId,
                    ShopId = r.ShopId,
                    RefundAmount = r.RefundAmount,
                    Reason = r.Reason,
                    SellerNote = r.SellerNote,
                    Status = r.Status.ToString(),
                    CreatedDate = r.CreatedDate
                }).ToList();

            return Result<List<RefundRequestDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting refund requests for Customer {CustomerId}", query.CustomerId);
            return Result<List<RefundRequestDto>>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
