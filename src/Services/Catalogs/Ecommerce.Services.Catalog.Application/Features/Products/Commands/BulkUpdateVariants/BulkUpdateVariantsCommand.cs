using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariants;

public record BulkUpdateVariantsCommand(
    long ProductId,
    List<BulkUpdateOptionDto> Options,
    List<BulkUpdateVariantDto> Variants
) : ICommand<ProductResponse>;

public record BulkUpdateOptionDto(
    long? Id,
    string Name,
    List<BulkUpdateOptionValueDto> Values
);

public record BulkUpdateOptionValueDto(
    long? Id,
    string Value,
    string? ImageUrl
);

public record BulkUpdateVariantDto(
    long? Id,
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