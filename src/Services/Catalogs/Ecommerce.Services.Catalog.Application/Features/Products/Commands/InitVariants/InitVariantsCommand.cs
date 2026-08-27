using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.SetupProductVariants;

public record OptionValueDto(string Value, string? ImageUrl = null);

public record OptionDto(
    string Name,
    List<OptionValueDto> Values
);

public record VariantOptionValueDto(
    string OptionName,
    string ValueName,
    string? ImageUrl = null
);

public record VariantDto(
    string? Sku, 
    decimal Price, 
    int AvailableStock, 
    List<VariantOptionValueDto> OptionValues,
    double? Weight = null,
    double? Length = null,
    double? Width = null,
    double? Height = null
);

public record InitVariantsCommand(
    long ProductId,
    List<OptionDto> Options,
    List<VariantDto> Variants
) : ICommand<ProductResponse>;
