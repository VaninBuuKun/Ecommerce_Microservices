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
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetShopRefunds;

public class GetShopRefundsQueryHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ILogger<GetShopRefundsQueryHandler> logger)
    : QueryHandler<GetShopRefundsQuery, List<RefundRequestDto>>
{
    protected override async Task<Result<List<RefundRequestDto>>> HandleQueryAsync(GetShopRefundsQuery query, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seller {SellerId} getting refund requests for Shop {ShopId}", query.SellerId, query.ShopId);
        try
        {
            // Kiểm tra quyền chủ shop
            var validationResult = await sellerService.ValidateShopOwnerAsync(query.ShopId, query.SellerId, cancellationToken);
            if (!validationResult.IsSuccess || !validationResult.Value)
            {
                return Result<List<RefundRequestDto>>.Failure("Bạn không phải là chủ sở hữu cửa hàng này.", EErrorCode.Forbidden);
            }

            var refundRepo = unitOfWork.Repository<RefundRequest, Guid>();
            var refunds = await refundRepo.GetAllAsync(r => r.ShopId == query.ShopId, null, cancellationToken);

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
            logger.LogError(ex, "Error getting refund requests for Shop {ShopId} by Seller {SellerId}", query.ShopId, query.SellerId);
            return Result<List<RefundRequestDto>>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
