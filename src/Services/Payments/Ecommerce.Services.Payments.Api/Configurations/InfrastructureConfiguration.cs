using System.Reflection;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Payments.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Payments.Api.Configurations;

public static class InfrastructureConfiguration
{
    public static void AddInfrastructureConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        //Db
        var connectionString = configuration.GetConnectionString("Database") ?? throw new InvalidOperationException("Database connection string is missing.");
        services.AddDbContext<PaymentDbContext>(options =>
            options.UseNpgsql(connectionString));
        
        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddConsumers
                (Assembly.GetExecutingAssembly());
        
            config.AddEntityFrameworkOutbox<PaymentDbContext>(o =>
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
