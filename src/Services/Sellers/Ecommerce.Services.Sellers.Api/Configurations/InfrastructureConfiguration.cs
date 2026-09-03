using BuildingBlocks.Messaging;
using Ecommerce.Services.Sellers.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Sellers.Api.Configurations;

public static class InfrastructureConfiguration
{
    public static void AddInfrastructureConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        //Db
        var connectionString = configuration.GetConnectionString("Database") ?? throw new InvalidOperationException("Database connection string is missing.");
        services.AddDbContext<SellerDbContext>(options =>
            options.UseNpgsql(connectionString));
        
        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddEntityFrameworkOutbox<SellerDbContext>(o =>
            {
                o.UsePostgres();
                o.UseBusOutbox();
            });
        });
        
        services.AddBuildingBlocksConfigurations(configuration);
        services.AddGrpcConfigurations(configuration);
        services.AddServiceConfigurations(configuration);
        
        
        services.AddHttpContextAccessor();
        services.AddHttpClient();
    }
}
