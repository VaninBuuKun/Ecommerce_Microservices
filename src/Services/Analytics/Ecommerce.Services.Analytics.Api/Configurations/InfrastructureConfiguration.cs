using System;
using System.Reflection;
using BuildingBlocks.Caching;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Analytics.Api.Persistances;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Analytics.Api.Configurations;

public static class InfrastructureConfiguration
{
    public static void AddInfrastructureConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var connectionString = configuration.GetConnectionString("Database")
            ?? throw new InvalidOperationException("Database connection string is missing.");
        services.AddDbContext<AnalyticsDbContext>(options =>
            options.UseNpgsql(connectionString));

        // Redis Caching
        services.AddCustomCaching(configuration.GetConnectionString("Redis") ?? "localhost:6379");

        // MassTransit Event Bus + EF Core Outbox
        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddConsumers(Assembly.GetExecutingAssembly());

            config.AddEntityFrameworkOutbox<AnalyticsDbContext>(o =>
            {
                o.UsePostgres();
                o.UseBusOutbox();
            });
        });

        // Building Blocks & Services
        services.AddBuildingBlocksConfigurations(configuration);
        services.AddServiceConfigurations(configuration);

        services.AddHttpContextAccessor();
        services.AddHttpClient();
    }
}
