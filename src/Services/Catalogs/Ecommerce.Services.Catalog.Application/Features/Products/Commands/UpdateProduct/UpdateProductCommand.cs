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
using System.Threading;
using System.Threading.Tasks;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(
    Guid Id, 
    string Name, 
    string Description, 
    double Weight, 
    double Length, 
    double Width, 
    double Height,
    string? ThumbnailUrl,
    string? VideoUrl,
    List<string> ImageUrls
) : ICommand<ProductResponse>;

