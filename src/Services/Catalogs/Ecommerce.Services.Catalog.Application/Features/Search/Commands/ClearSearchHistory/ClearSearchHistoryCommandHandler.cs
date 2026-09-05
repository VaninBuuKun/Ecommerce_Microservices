using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.ClearSearchHistory;

public class ClearSearchHistoryCommandHandler(
    IConnectionMultiplexer redis,
    ILogger<ClearSearchHistoryCommandHandler> logger
) : CommandHandler<ClearSearchHistoryCommand, bool>
{
    protected override async Task<Result<bool>> HandleCommandAsync(ClearSearchHistoryCommand command, CancellationToken cancellationToken)
    {
        try
        {
            if (command.UserId > 0)
            {
                var db = redis.GetDatabase();
                await db.KeyDeleteAsync($"search:history:{command.UserId}");
            }
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error clearing search history for user {UserId}", command.UserId);
            return Result<bool>.Success(false);
        }
    }
}
