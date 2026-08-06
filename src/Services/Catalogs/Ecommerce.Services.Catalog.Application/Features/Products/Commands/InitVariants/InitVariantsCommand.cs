using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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
    int AvailableStocks, 
    List<VariantOptionValueDto> OptionValues,
    double? Weight = null,
    double? Length = null,
    double? Width = null,
    double? Height = null
);

public record InitVariantsCommand(
    Guid ProductId,
    List<OptionDto> Options,
    List<VariantDto> Variants
) : ICommand<ProductResponse>;

