using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.InitSingleVariant;

public record InitSingleVariantCommand(
    Guid ProductId,
    decimal Price,
    int AvailableStocks,
    string? Sku = null,
    double? Weight = null,
    double? Length = null,
    double? Width = null,
    double? Height = null
) : ICommand<ProductResponse>;

