using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.Converters;
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using StackExchange.Redis;

namespace BuildingBlocks.Caching;

public class RedisCacheService : ICacheService
{
    private readonly IDatabase _database;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        Converters =
        {
            new LongToStringJsonConverter(),
            new NullableLongToStringJsonConverter()
        }
    };

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(
        string key,
        CancellationToken token = default)
    {
        var value = await _database.StringGetAsync(key);
        if (value.IsNullOrEmpty)
            return default;

        try
        {
            return JsonSerializer.Deserialize<T>(
                value!,
                JsonOptions);
        }
        catch (JsonException)
        {
            // If stale/corrupted cache data cannot be deserialized, auto-evict and return default
            await _database.KeyDeleteAsync(key);
            return default;
        }
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan? expiry = null,
        CancellationToken token = default)
    {
        var json = JsonSerializer.Serialize(
            value,
            JsonOptions);

        await _database.StringSetAsync(key, json, expiry ?? TimeSpan.FromMinutes(5));
    }

    public async Task RemoveAsync(
        string key,
        CancellationToken token = default)
    {
        await _database.KeyDeleteAsync(key);
    }

    public async Task ExistsAsync(
        string key,
        CancellationToken token = default)
    {
        await _database.KeyExistsAsync(key);
    }
}