using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries;

public record GetVariantsByIdsQuery(List<long> VariantIds, List<long> ProductIds) : ICommand<List<VariantDto>>;
