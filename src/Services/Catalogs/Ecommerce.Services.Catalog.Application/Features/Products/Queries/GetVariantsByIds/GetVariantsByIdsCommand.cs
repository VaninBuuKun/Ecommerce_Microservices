using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries;

public record GetVariantsByIdsQuery(List<Guid> VariantIds, List<Guid> ProductIds) : IRequest<Result<List<VariantDto>>>;