using BuildingBlocks.Auth;
using BuildingBlocks.Messaging;
using BuildingBlocks.Web.Extensions;

namespace Ecommerce.Services.Identity.Api.Configurations;

public static class BuildingBlocksConfigurations
{
    public static void AddBuildingBlocksConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddBuildingBlocksWeb(configuration);
        services.AddBuildingBlocsAuth(configuration);
        services.AddMasstransitEventBus(configuration);
    }
}
