using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetVariantById;

public record GetVariantByIdQuery(long VariantId) : IQuery<VariantDto>;