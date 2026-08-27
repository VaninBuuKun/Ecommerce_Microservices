using System.Reflection;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Web.Behaviors;
using FluentValidation;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddBuildingBlocksApplication(this IServiceCollection services, Assembly assembly)
    {
        //assembly lúc này là Service.Application.
        services.AddValidatorsFromAssembly(assembly);
        
        //Cấu hiình MediaTR
        services.AddMediatR(cfg =>
        {
            //Tìm tất cả các command, handlers, queries.
            cfg.RegisterServicesFromAssembly(assembly); 
            
            //Add validation behavior vào MediatR pipeline
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        
        services.AddScoped<IInMemoryBus, MediatRInMemoryBus>();
        
        // Cấu hình ID Generator (Snowflake)
        services.AddSingleton<BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator.ISnowflakeIdGenerator, BuildingBlocks.Application.IdGenerator.SnowflakeIdGenerator>();
        services.AddSingleton<BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator.IIdGenerator>(sp => (BuildingBlocks.Application.IdGenerator.SnowflakeIdGenerator)sp.GetRequiredService<BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator.ISnowflakeIdGenerator>());
        
        //Cấu hình Mapster
        var config = TypeAdapterConfig.GlobalSettings;
        config.Scan(assembly);
        services.AddSingleton(config);
        services.AddScoped<IMapper, ServiceMapper>();
        return services;
    }
    
}