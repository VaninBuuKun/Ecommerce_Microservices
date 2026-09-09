using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Queries.GetSearchHistory;

public record GetSearchHistoryQuery(long UserId) : IQuery<List<string>>;
