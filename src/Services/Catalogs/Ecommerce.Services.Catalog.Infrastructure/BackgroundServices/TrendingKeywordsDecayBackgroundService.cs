using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ecommerce.Services.Catalog.Infrastructure.BackgroundServices;

public class TrendingKeywordsDecayBackgroundService(
    IConnectionMultiplexer redis,
    IConfiguration configuration,
    ILogger<TrendingKeywordsDecayBackgroundService> logger
) : BackgroundService
{
    private const string TrendingKey = "search:trending";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("TrendingKeywordsDecayBackgroundService is starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var campaignEnabled = configuration.GetValue<bool>("TrendingSearch:Campaign:IsEnabled", false);
                var decayHours = configuration.GetValue<int>("TrendingSearch:DecayHours", 24);

                if (campaignEnabled)
                {
                    var campaignDecayHours = configuration.GetValue<int?>("TrendingSearch:Campaign:DecayHours");
                    if (campaignDecayHours.HasValue && campaignDecayHours.Value > 0)
                    {
                        decayHours = campaignDecayHours.Value;
                    }
                }

                await Task.Delay(TimeSpan.FromHours(decayHours), stoppingToken);

                logger.LogInformation("Executing scheduled decay on Redis trending keywords...");

                var decayFactor = configuration.GetValue<double>("TrendingSearch:DecayFactor", 0.5);
                var db = redis.GetDatabase();

                var allEntries = await db.SortedSetRangeByRankWithScoresAsync(TrendingKey, 0, -1);
                foreach (var entry in allEntries)
                {
                    var newScore = entry.Score * decayFactor;
                    if (newScore < 1.0)
                    {
                        await db.SortedSetRemoveAsync(TrendingKey, entry.Element);
                    }
                    else
                    {
                        await db.SortedSetAddAsync(TrendingKey, entry.Element, newScore);
                    }
                }

                logger.LogInformation("Successfully decayed {Count} trending keywords with factor {Factor}", allEntries.Length, decayFactor);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while performing trending keywords decay");
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }
    }
}
