using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ReleaseVariantStocks;

public record ReleaseStocksCommand(List<VariantStockDto> VariantStockDtos) : ICommand;
