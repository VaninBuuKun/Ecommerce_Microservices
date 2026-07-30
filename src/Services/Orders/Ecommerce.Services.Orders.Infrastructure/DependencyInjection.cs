using System.Reflection;
using BuildingBlocks.Caching;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Ecommerce.Services.Orders.Infrastructure.Persistence;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Orders.Infrastructure.Sagas;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Orders.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database");
        
        services.AddCustomCaching(configuration.GetConnectionString("Redis") ?? throw new InvalidOperationException("Redis connection string is missing."));
        services.AddDbContext<OrderDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddConsumers(Assembly.GetExecutingAssembly());
            config.AddSagaStateMachine<SubOrderStateMachine, SubOrderSagaState>()
                .EntityFrameworkRepository(r =>
                {
                    r.ConcurrencyMode = ConcurrencyMode.Optimistic;
                    r.ExistingDbContext<OrderDbContext>();
                });

            config.AddEntityFrameworkOutbox<OrderDbContext>(o =>
            {
                o.UsePostgres();
                o.UseBusOutbox();
            });
        });
        
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<OrderDbContext>>();
        
        return services;
    }
}
