using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.Messaging;
using BuildingBlocks.Web.Extensions;

namespace Ecommerce.Services.Shippings.Api.Configurations;

public static class BuildingBlocksConfigurations
{
    public static void AddBuildingBlocksConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddBuildingBlocksWeb(configuration);
        services.AddBuildingBlocksApplication(typeof(Program).Assembly);
        services.AddBuildingBlocsAuth(configuration);
    }
}
