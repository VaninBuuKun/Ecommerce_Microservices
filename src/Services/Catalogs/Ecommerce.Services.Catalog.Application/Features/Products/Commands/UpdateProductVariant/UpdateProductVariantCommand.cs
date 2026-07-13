using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductVariant;

public record UpdateProductVariantCommand(
    Guid VariantId,
    string? Sku,
    decimal Price,
    int AvailableStocks
) : ICommand<VariantDto>;

