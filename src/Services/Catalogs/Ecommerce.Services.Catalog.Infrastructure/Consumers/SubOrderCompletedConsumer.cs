using System;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Infrastructure.Consumers;

public class SubOrderCompletedConsumer(
    IEfUnitOfWork unitOfWork,
    ILogger<SubOrderCompletedConsumer> logger)
    : IConsumer<SubOrderCompletedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderCompletedEvent> context)
    {
        var @event = context.Message;
        logger.LogInformation("Processing SubOrderCompletedEvent in Catalog Service for SubOrder {SubOrderId}", @event.SubOrderId);

        if (@event.Items == null || !@event.Items.Any())
        {
            logger.LogWarning("No items in SubOrderCompletedEvent for SubOrder {SubOrderId}", @event.SubOrderId);
            return;
        }

        try
        {
            var variantRepo = unitOfWork.Repository<ProductVariant, long>();
            var productRepo = unitOfWork.Repository<Product, long>();

            var variantIds = @event.Items.Select(i => i.VariantId).ToList();
            var variants = await variantRepo.GetAllAsync(v => variantIds.Contains(v.Id));

            var productIds = variants.Select(v => v.ProductId).Distinct().ToList();
            var products = await productRepo.GetAllAsync(p => productIds.Contains(p.Id));

            foreach (var item in @event.Items)
            {
                var variant = variants.FirstOrDefault(v => v.Id == item.VariantId);
                if (variant == null) continue;

                var product = products.FirstOrDefault(p => p.Id == variant.ProductId);
                if (product == null) continue;

                product.IncreaseSold(item.Quantity);
                productRepo.Update(product);
            }

            await unitOfWork.SaveChangesAsync();
            logger.LogInformation("Successfully updated product sold counters for SubOrder {SubOrderId}", @event.SubOrderId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update product sold counters for SubOrder {SubOrderId}", @event.SubOrderId);
            throw;
        }
    }
}
