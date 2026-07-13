using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Infrastructure.Persistence;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Catalog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database");
        var serverVersionString = configuration["DbSettings:ServerVersion"] ?? "8.0.32";
        var serverVersion = new MySqlServerVersion(new Version(serverVersionString));

        services.AddDbContext<ProductDbContext>(options =>
            options.UseMySql(
                connectionString, 
                serverVersion
            ));
        

        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<ProductDbContext>>();
        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddConsumers(typeof(DependencyInjection).Assembly);
        });

        return services;
    }
}
