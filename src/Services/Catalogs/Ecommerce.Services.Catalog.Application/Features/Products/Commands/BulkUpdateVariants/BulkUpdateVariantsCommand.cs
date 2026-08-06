using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.SetupProductVariants;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductVariant;

public record BulkUpdateVariantDto(
    Guid? Id,
    string? Sku,
    decimal Price,
    int AvailableStocks,
    List<VariantOptionValueDto> OptionValues,
    double? Weight = null,
    double? Length = null,
    double? Width = null,
    double? Height = null
);

public record BulkUpdateVariantsCommand(
    Guid ProductId,
    List<BulkUpdateVariantDto> Variants
) : ICommand<ProductResponse>;

