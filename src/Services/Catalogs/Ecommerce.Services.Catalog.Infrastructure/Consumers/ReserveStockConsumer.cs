using Ecommerce.Services.Carts.Contracts.Dtos;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReserveVariantStock;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;
using MediatR;
namespace Ecommerce.Services.Catalog.Infrastructure.Consumers;

public class ReserveStockConsumer(ISender sender) : IConsumer<ReserveStocksRequest>
{
    public async Task Consume(ConsumeContext<ReserveStocksRequest> context)
    {
        var command = context.Message;
        
        var result = await sender.Send(new ReserveStocksCommand(
            command.VariantItems.Select(x => new VariantStockDto()
            {
                VariantId = x.VariantId,
                Quantity = x.Quantity
            }).ToList()
        ));

        if (!result.Value.IsSuccess)
        {
            await context.Publish<StockInsufficientEvent>(new StockInsufficientEvent()
            {
                OrderId = command.OrderId,
                VariantStockInsufficient = result.Value.VariantStocks.Select(x => new VariantStockInsufficientData()
                {
                    VariantId = x.VariantId,
                    Quantity = x.Quantity,
                    Stocks = x.AvailableStocks
                }).ToList()
            });
        }
        else
        {
            await context.Publish<StockReservedEvent>(new StockReservedEvent()
            {
                OrderId = command.OrderId,
            });
        }
    }
}