using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;

namespace BuildingBlocks.Caching;

using System.Text.Json;
using StackExchange.Redis;

public class RedisCacheService : ICacheService
{
    private readonly IDatabase _database;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
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

        return JsonSerializer.Deserialize<T>(
            value!,
            JsonOptions);
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