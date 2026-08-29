using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(
    long Id, 
    string Name, 
    string Description, 
    string? ThumbnailUrl,
    string? VideoUrl,
    List<string> ImageUrls,
    long? CategoryId,
    string? AttributesJson
) : ICommand<ProductResponse>;
