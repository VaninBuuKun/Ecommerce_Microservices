using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrderItemsForRebuy;

public class GetSubOrderItemsForRebuyQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetSubOrderItemsForRebuyQueryHandler> logger)
    : IRequestHandler<GetSubOrderItemsForRebuyQuery, Result<List<SubOrderItemRebuyResultDto>>>
{
    public async Task<Result<List<SubOrderItemRebuyResultDto>>> Handle(
        GetSubOrderItemsForRebuyQuery request, 
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Querying sub-order items for rebuy: SubOrderId={SubOrderId}, CustomerId={CustomerId}",
            request.SubOrderId, request.CustomerId);

        var subOrderRepository = unitOfWork.Repository<SubOrder, long>();
        var subOrder = await subOrderRepository.FirstOrDefaultAsync(
            predicate: s => s.Id == request.SubOrderId,
            includes: [s => s.SubOrderItems]);

        if (subOrder == null)
        {
            logger.LogWarning("SubOrder #{SubOrderId} not found for rebuy", request.SubOrderId);
            return Result<List<SubOrderItemRebuyResultDto>>.Failure("Đơn hàng không tồn tại.", EErrorCode.NotFound);
        }

        if (subOrder.CustomerId != request.CustomerId)
        {
            logger.LogWarning("SubOrder #{SubOrderId} does not belong to Customer #{CustomerId}", 
                request.SubOrderId, request.CustomerId);
            return Result<List<SubOrderItemRebuyResultDto>>.Failure("Bạn không có quyền truy cập đơn hàng này.", EErrorCode.Forbidden);
        }

        var items = subOrder.SubOrderItems
            .Select(i => new SubOrderItemRebuyResultDto(i.VariantId, i.ProductId, i.Quantity))
            .ToList();

        return Result<List<SubOrderItemRebuyResultDto>>.Success(items);
    }
}
