using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.InitSingleVariant;

public record UpdateProductSaleCommand(
    long ProductId,
    decimal Price,
    int AvailableStocks,
    double Weight,
    double Length,
    double Width,
    double Height,
    decimal DiscountPrice
) : ICommand<ProductResponse>;
