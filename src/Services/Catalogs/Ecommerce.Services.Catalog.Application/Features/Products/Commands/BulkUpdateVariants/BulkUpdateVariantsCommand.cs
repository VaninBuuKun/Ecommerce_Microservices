using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariants;

public record BulkUpdateVariantsCommand(
    Guid ProductId,
    List<BulkUpdateOptionDto> Options,
    List<BulkUpdateVariantDto> Variants
) : ICommand<ProductResponse>;

public record BulkUpdateOptionDto(
    Guid? Id,
    string Name,
    List<BulkUpdateOptionValueDto> Values
);

public record BulkUpdateOptionValueDto(
    Guid? Id,
    string Value,
    string? ImageUrl
);

public record BulkUpdateVariantDto(
    Guid? Id,
    decimal Price,
    decimal? DiscountPrice,
    int AvailableStock,
    double Weight,
    double Length,
    double Width,
    double Height,
    List<BulkUpdateVariantOptionValueDto> OptionValues
);

public record BulkUpdateVariantOptionValueDto(
    string OptionName,
    string ValueName
);