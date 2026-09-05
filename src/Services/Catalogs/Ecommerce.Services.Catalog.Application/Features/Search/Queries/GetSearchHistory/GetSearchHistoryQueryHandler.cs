using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Queries.GetSearchHistory;

public class GetSearchHistoryQueryHandler(
    IConnectionMultiplexer redis,
    ILogger<GetSearchHistoryQueryHandler> logger
) : QueryHandler<GetSearchHistoryQuery, List<string>>
{
    protected override async Task<Result<List<string>>> HandleQueryAsync(GetSearchHistoryQuery query, CancellationToken cancellationToken)
    {
        try
        {
            if (query.UserId <= 0)
            {
                return Result<List<string>>.Success(new List<string>());
            }

            var db = redis.GetDatabase();
            var values = await db.ListRangeAsync($"search:history:{query.UserId}", 0, 4);
            var result = values.Select(v => v.ToString()).ToList();

            return Result<List<string>>.Success(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting search history for user {UserId}", query.UserId);
            return Result<List<string>>.Success(new List<string>());
        }
    }
}
