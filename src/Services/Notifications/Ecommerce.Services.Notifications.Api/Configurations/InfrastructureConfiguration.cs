using System.Reflection;
using BuildingBlocks.BackgroundJobs.Configurations;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Notifications.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Notifications.Api.Configurations;

public static class InfrastructureConfiguration
{
    public static void AddInfrastructureConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var connectionString = configuration.GetConnectionString("Database")
            ?? throw new InvalidOperationException("Database connection string is missing.");

        services.AddDbContext<NotificationDbContext>(options =>
            options.UseNpgsql(connectionString));

        // MassTransit + RabbitMQ (subscribe events from other services)
        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddConsumers(Assembly.GetExecutingAssembly());

            config.AddEntityFrameworkOutbox<NotificationDbContext>(o =>
            {
                o.UsePostgres();
                o.UseBusOutbox();
            });
        });

        services.AddBuildingBlocksConfigurations(configuration);
        services.AddServiceConfigurations(configuration);
        services.AddGrpcConfigurations(configuration);
        services.AddBuildingBlocksHangfire(configuration, schemaName: "hangfire_notifications");

        services.AddHttpContextAccessor();
    }
}
