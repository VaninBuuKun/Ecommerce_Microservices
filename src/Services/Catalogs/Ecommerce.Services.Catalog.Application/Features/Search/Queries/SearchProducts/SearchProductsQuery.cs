using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Search.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Queries.SearchProducts;

public record SearchProductsQuery(
    string? Query = null,
    int Page = 1,
    int PageSize = 36,
    long? CategoryId = null,
    double? MinRating = null,
    string SortBy = "relevance",
    long? ShopId = null,
    bool? HasDiscount = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null
) : IQuery<SearchProductsResponseDto>;
