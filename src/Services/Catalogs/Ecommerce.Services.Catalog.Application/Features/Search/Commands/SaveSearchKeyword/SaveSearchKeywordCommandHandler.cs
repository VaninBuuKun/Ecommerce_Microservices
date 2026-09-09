using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Commands.SaveSearchKeyword;

public class SaveSearchKeywordCommandHandler(
    IConnectionMultiplexer redis,
    ILogger<SaveSearchKeywordCommandHandler> logger
) : CommandHandler<SaveSearchKeywordCommand, bool>
{
    protected override async Task<Result<bool>> HandleCommandAsync(SaveSearchKeywordCommand command, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(command.Keyword))
            {
                return Result<bool>.Success(true);
            }

            var cleanKeyword = command.Keyword.Trim();
            if (cleanKeyword.Length > 100)
            {
                cleanKeyword = cleanKeyword.Substring(0, 100);
            }

            var db = redis.GetDatabase();

            // Lưu lịch sử tìm kiếm người dùng nếu đã đăng nhập (Giới hạn tối đa 5 phần tử)
            if (command.UserId.HasValue && command.UserId.Value > 0)
            {
                var historyKey = $"search:history:{command.UserId.Value}";
                await db.ListRemoveAsync(historyKey, cleanKeyword);
                await db.ListLeftPushAsync(historyKey, cleanKeyword);
                await db.ListTrimAsync(historyKey, 0, 4);
                await db.KeyExpireAsync(historyKey, TimeSpan.FromDays(30));
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while saving search keyword '{Keyword}'", command.Keyword);
            return Result<bool>.Success(false);
        }
    }
}
