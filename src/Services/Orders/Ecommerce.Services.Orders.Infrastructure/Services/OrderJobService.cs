using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.Services;

public class OrderJobService(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<OrderJobService> logger)
    : IOrderJobService
{
    public async Task AutoCompleteSubOrderAsync(long subOrderId)
    {
        logger.LogInformation("Hangfire Job: Processing auto-completion for SubOrder {SubOrderId}", subOrderId);

        var subOrderRepo = unitOfWork.Repository<SubOrder, long>();
        var subOrder = await subOrderRepo.GetByIdAsync(subOrderId);

        if (subOrder == null)
        {
            logger.LogWarning("SubOrder {SubOrderId} not found. Skipping auto-complete job.", subOrderId);
            return;
        }

        // Idempotency check: Chỉ tự động hoàn tất nếu trạng thái vẫn là Delivered
        if (subOrder.Status != SubOrderStatus.Delivered)
        {
            logger.LogInformation("SubOrder {SubOrderId} status is '{Status}' (not 'Delivered'). Skipping auto-complete job.", 
                subOrderId, subOrder.Status);
            return;
        }

        logger.LogInformation("Auto-completing SubOrder {SubOrderId} after 7 days delivered.", subOrderId);

        subOrder.UpdateSubOrderStatus(SubOrderStatus.Completed);
        subOrderRepo.Update(subOrder);

        // Publish event để cộng doanh thu cho Seller ở Payment Service (qua EF Core Outbox)
        await publisher.PublishAsync(new SubOrderCompletedEvent
        {
            SubOrderId = subOrder.Id,
            ShopId = subOrder.ShopId,
            TotalAmount = subOrder.GrandTotal,
            PlatformDiscount = subOrder.PlatformDiscount
        });

        await unitOfWork.SaveChangesAsync();
        logger.LogInformation("Successfully auto-completed SubOrder {SubOrderId}.", subOrderId);
    }
}
