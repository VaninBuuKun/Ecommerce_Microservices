using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetAdminProducts;

public record GetAdminProductsQuery(
    int Page = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    long? CategoryId = null,
    long? ShopId = null,
    string? Status = null
) : IQuery<PagedResult<ProductResponse>>;
