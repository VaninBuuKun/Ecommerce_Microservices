using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateMultiVariants;

public record UpdateMultiVariantsCommand(
    long ProductId,
    List<MultiUpdateOptionDto> Options,
    List<MultiUpdateVariantDto> Variants
) : ICommand<ProductResponse>;

public record MultiUpdateOptionDto(
    long? Id,
    string Name,
    List<MultiUpdateOptionValueDto> Values
);

public record MultiUpdateOptionValueDto(
    long? Id,
    string Value,
    string? ImageUrl
);

public record MultiUpdateVariantDto(
    long? Id,
    decimal Price,
    decimal? DiscountPrice,
    int AvailableStock,
    List<MultiUpdateVariantOptionValueDto> OptionValues
);

public record MultiUpdateVariantOptionValueDto(
    string OptionName,
    string ValueName
);
