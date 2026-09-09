using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.RemoveSearchHistoryItem;

public class RemoveSearchHistoryItemCommandHandler(
    IConnectionMultiplexer redis,
    ILogger<RemoveSearchHistoryItemCommandHandler> logger
) : CommandHandler<RemoveSearchHistoryItemCommand, bool>
{
    protected override async Task<Result<bool>> HandleCommandAsync(RemoveSearchHistoryItemCommand command, CancellationToken cancellationToken)
    {
        try
        {
            if (command.UserId > 0 && !string.IsNullOrWhiteSpace(command.Keyword))
            {
                var db = redis.GetDatabase();
                await db.ListRemoveAsync($"search:history:{command.UserId}", command.Keyword.Trim());
            }
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error removing search history item '{Keyword}' for user {UserId}", command.Keyword, command.UserId);
            return Result<bool>.Success(false);
        }
    }
}
