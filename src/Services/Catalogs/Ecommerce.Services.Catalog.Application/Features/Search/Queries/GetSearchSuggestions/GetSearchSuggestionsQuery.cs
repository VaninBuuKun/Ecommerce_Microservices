using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Catalog.Application.Features.Search.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Queries.GetSearchSuggestions;

public record GetSearchSuggestionsQuery(
    string Query, 
    int Limit = 5
) : IQuery<SearchSuggestionsResponseDto>;
