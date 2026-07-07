using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReserveVariantStock;


public record ReserveStocksCommand(List<VariantStockDto> VariantStockDtos) : ICommand<ReserveVariantResponse>;

