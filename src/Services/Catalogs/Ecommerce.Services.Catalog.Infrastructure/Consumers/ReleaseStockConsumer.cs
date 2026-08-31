using Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReleaseVariantStocks;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Contracts.Requests;
using MassTransit;
using MediatR;

namespace Ecommerce.Services.Catalog.Infrastructure.Consumers;

public class ReleaseStockConsumer(ISender sender) : IConsumer<ReleaseStocksRequest>
{
    public async Task Consume(ConsumeContext<ReleaseStocksRequest> context)
    {
        var command = context.Message;
        
        await sender.Send(new ReleaseStocksCommand(
            command.VariantItems.Select(x => new VariantStockDto()
            {
                ProductId = x.ProductId,
                VariantId = x.VariantId,
                Quantity = x.Quantity
            }).ToList()
        ));
    }
}
