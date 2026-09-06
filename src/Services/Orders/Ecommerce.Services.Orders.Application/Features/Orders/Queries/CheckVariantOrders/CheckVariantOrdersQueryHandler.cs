using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.CheckVariantOrders;

public class CheckVariantOrdersQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<CheckVariantOrdersQueryHandler> logger)
    : IRequestHandler<CheckVariantOrdersQuery, Result<VariantOrdersStatusDto>>
{
    private static readonly SubOrderStatus[] TerminalStatuses =
    [
        SubOrderStatus.Completed,
        SubOrderStatus.Cancelled,
        SubOrderStatus.Refunded
    ];

    public async Task<Result<VariantOrdersStatusDto>> Handle(CheckVariantOrdersQuery request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Checking orders status for VariantId: {VariantId}", request.VariantId);

            var subOrderRepository = unitOfWork.Repository<SubOrder, long>();

            // 1. Kiểm tra xem có bất kỳ đơn hàng nào từng chứa Variant này hay không
            var hasAnyOrders = await subOrderRepository.AnyAsync(
                s => s.SubOrderItems.Any(i => i.VariantId == request.VariantId),
                cancellationToken);

            // 2. Kiểm tra xem có đơn hàng nào đang trong tiến trình xử lý hay không
            var hasActiveOrders = false;
            if (hasAnyOrders)
            {
                hasActiveOrders = await subOrderRepository.AnyAsync(
                    s => !TerminalStatuses.Contains(s.Status)
                      && s.SubOrderItems.Any(i => i.VariantId == request.VariantId),
                    cancellationToken);
            }

            logger.LogInformation("Variant {VariantId} HasAnyOrders: {HasAny}, HasActiveOrders: {HasActive}",
                request.VariantId, hasAnyOrders, hasActiveOrders);

            return Result<VariantOrdersStatusDto>.Success(new VariantOrdersStatusDto(hasAnyOrders, hasActiveOrders));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error checking orders for VariantId: {VariantId}", request.VariantId);
            return Result<VariantOrdersStatusDto>.Failure($"Có lỗi xảy ra khi kiểm tra đơn hàng của biến thể {request.VariantId}.");
        }
    }
}
