using System.Reflection;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Shippings.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Shippings.Api.Configurations;

public static class InfrastructureConfiguration
{
    public static void AddInfrastructureConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        //Db
        var connectionString = configuration.GetConnectionString("Database") ?? throw new InvalidOperationException("Database connection string is missing.");
        services.AddDbContext<ShippingDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddConsumers(Assembly.GetExecutingAssembly());
            config.AddEntityFrameworkOutbox<ShippingDbContext>(o =>
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