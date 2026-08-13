using BuildingBlocks.Application;
using BuildingBlocks.Caching;
using BuildingBlocks.Messaging;
using BuildingBlocks.Web.Extensions;

namespace Ecommerce.Services.Carts.Api.Configurations;

public static class BuildingBlocksConfigurations
{
    public static void AddBuildingBlocksConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCustomCaching(configuration.GetConnectionString("Redis") ?? throw new InvalidOperationException("RedisConnectionString is missing."));
        services.AddBuildingBlocksWeb(configuration);
        services.AddBuildingBlocksApplication(typeof(Program).Assembly);
    }
}