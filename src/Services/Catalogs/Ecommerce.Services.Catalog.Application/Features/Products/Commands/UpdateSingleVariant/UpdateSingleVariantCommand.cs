using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateSingleVariant;

public record UpdateSingleVariantCommand(
    long ProductId,
    decimal Price,
    int AvailableStock,
    int Weight,
    int Length,
    int Width,
    int Height,
    decimal? DiscountPrice
) : ICommand<ProductResponse>;
