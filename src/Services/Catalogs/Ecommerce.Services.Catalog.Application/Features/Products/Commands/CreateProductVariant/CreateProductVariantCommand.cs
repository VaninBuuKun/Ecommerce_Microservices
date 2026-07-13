using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProductVariant;

public record CreateProductVariantCommand(
    Guid ProductId,
    string? Sku,
    decimal Price,
    int AvailableStocks,
    List<Guid> OptionValueIds
) : ICommand<VariantDto>;

