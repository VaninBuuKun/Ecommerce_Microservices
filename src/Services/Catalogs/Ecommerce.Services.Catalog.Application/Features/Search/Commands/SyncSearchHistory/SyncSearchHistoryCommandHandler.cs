using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.SyncSearchHistory;

public class SyncSearchHistoryCommandHandler(
    IConnectionMultiplexer redis,
    ILogger<SyncSearchHistoryCommandHandler> logger
) : CommandHandler<SyncSearchHistoryCommand, List<string>>
{
    protected override async Task<Result<List<string>>> HandleCommandAsync(SyncSearchHistoryCommand command, CancellationToken cancellationToken)
    {
        try
        {
            if (command.UserId <= 0)
            {
                return Result<List<string>>.Success(new List<string>());
            }

            var db = redis.GetDatabase();
            var historyKey = $"search:history:{command.UserId}";

            if (command.Keywords != null && command.Keywords.Any())
            {
                // Sync các từ khóa từ client lên (giữ thứ tự, tối đa 5 phần tử)
                foreach (var kw in command.Keywords.Where(k => !string.IsNullOrWhiteSpace(k)).Take(5).Reverse())
                {
                    var cleanKw = kw.Trim();
                    await db.ListRemoveAsync(historyKey, cleanKw);
                    await db.ListLeftPushAsync(historyKey, cleanKw);
                }
                await db.ListTrimAsync(historyKey, 0, 4);
                await db.KeyExpireAsync(historyKey, TimeSpan.FromDays(30));
            }

            var values = await db.ListRangeAsync(historyKey, 0, 4);
            var result = values.Select(v => v.ToString()).ToList();

            return Result<List<string>>.Success(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error syncing search history for user {UserId}", command.UserId);
            return Result<List<string>>.Success(new List<string>());
        }
    }
}
