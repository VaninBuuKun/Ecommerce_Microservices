using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.Web.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Analytics.Api.Configurations;

public static class BuildingBlocksConfigurations
{
    public static void AddBuildingBlocksConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddBuildingBlocksWeb(configuration);
        services.AddBuildingBlocksApplication(typeof(Program).Assembly);
        services.AddBuildingBlocsAuth(configuration);
    }
}
