using BuildingBlocks.Application;
using BuildingBlocks.Auth;

namespace Ecommerce.Services.Carts.Api.Configurations;

public static class InfrastructureConfigurations
{
    public static void AddInfrastructureConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddBuildingBlocksConfigurations(configuration);
        services.AddGrpcConfigurations(configuration);
        services.AddServiceConfigurations(configuration);
        
        services.AddBuildingBlocksApplication(typeof(Program).Assembly);
        services.AddBuildingBlocsAuth(configuration);
    }
}
