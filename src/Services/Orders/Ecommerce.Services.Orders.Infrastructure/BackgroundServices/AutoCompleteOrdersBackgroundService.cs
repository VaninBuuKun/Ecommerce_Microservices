using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.BackgroundServices;

public class AutoCompleteOrdersBackgroundService(
    IServiceProvider serviceProvider,
    ILogger<AutoCompleteOrdersBackgroundService> logger)
    : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(5); // Quét định kỳ mỗi 5 phút

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AutoCompleteOrdersBackgroundService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAutoCompleteOrders(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while processing auto-complete orders.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }

        logger.LogInformation("AutoCompleteOrdersBackgroundService is stopping.");
    }

    private async Task ProcessAutoCompleteOrders(CancellationToken stoppingToken)
    {
        using var scope = serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IEfUnitOfWork>();
        var publisher = scope.ServiceProvider.GetRequiredService<IEventPublisher>();

        var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
        
        // Quét các đơn hàng đã giao thành công quá 7 ngày
        var cutOffTime = DateTimeOffset.UtcNow.AddDays(-7);
        
        var ordersToComplete = await subOrderRepo.GetAllAsync(
            s => s.Status == SubOrderStatus.Delivered && s.DeliveredDate <= cutOffTime, 
            null,
            stoppingToken);

        if (!ordersToComplete.Any())
        {
            return;
        }

        logger.LogInformation("Found {Count} sub-orders that have been delivered for more than 7 days. Completing them now...", ordersToComplete.Count);

        foreach (var subOrder in ordersToComplete)
        {
            try
            {
                logger.LogInformation("Auto-completing SubOrder {SubOrderId}", subOrder.Id);
                
                subOrder.UpdateSubOrderStatus(SubOrderStatus.Completed);
                subOrderRepo.Update(subOrder);

                // Publish event để cộng doanh thu cho Seller ở Payment Service
                await publisher.PublishAsync(new SubOrderCompletedEvent
                {
                    SubOrderId = subOrder.Id,
                    ShopId = subOrder.ShopId,
                    TotalAmount = subOrder.GrandTotal,
                    PlatformDiscount = subOrder.PlatformDiscount  // Sàn tự bỏ ra, không ảnh hưởng seller
                }, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error auto-completing SubOrder {SubOrderId}", subOrder.Id);
            }
        }

        await unitOfWork.SaveChangesAsync(stoppingToken);
        logger.LogInformation("Finished auto-completing orders.");
    }
}
