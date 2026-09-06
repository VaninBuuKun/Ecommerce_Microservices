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

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.CheckProductHasActiveSubOrders;

public class CheckProductHasActiveSubOrdersQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<CheckProductHasActiveSubOrdersQueryHandler> logger) 
    : IRequestHandler<CheckProductHasActiveSubOrdersQuery, Result<bool>>
{
    private static readonly SubOrderStatus[] TerminalStatuses =
    [
        SubOrderStatus.Completed,
        SubOrderStatus.Cancelled,
        SubOrderStatus.Refunded
    ];

    public async Task<Result<bool>> Handle(CheckProductHasActiveSubOrdersQuery request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Checking active SubOrders for ProductId: {ProductId}", request.ProductId);

            var subOrderRepository = unitOfWork.Repository<SubOrder, long>();

            // Kiểm tra xem có SubOrder nào chứa sản phẩm này mà trạng thái chưa kết thúc (không thuộc Completed, Cancelled, Refunded)
            var hasActive = await subOrderRepository.AnyAsync(
                s => !TerminalStatuses.Contains(s.Status) 
                  && s.SubOrderItems.Any(i => i.ProductId == request.ProductId),
                cancellationToken);

            logger.LogInformation("Product {ProductId} hasActiveSubOrders: {HasActive}", request.ProductId, hasActive);

            return Result<bool>.Success(hasActive);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error checking active SubOrders for ProductId: {ProductId}", request.ProductId);
            return Result<bool>.Failure($"Có lỗi xảy ra khi kiểm tra đơn hàng của sản phẩm {request.ProductId}.");
        }
    }
}
