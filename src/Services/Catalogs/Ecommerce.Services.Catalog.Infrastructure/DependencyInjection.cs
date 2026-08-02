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

        // Đăng ký Grpc Client gọi sang Seller Service
        services.AddGrpcClient<BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["GrpcSettings:SellerUrl"] ?? "http://localhost:5004");
        });

        services.AddScoped<Ecommerce.Services.Catalog.Application.Commons.Interfaces.ISellerService, Ecommerce.Services.Catalog.Infrastructure.GrpcClients.SellerClientService>();
        services.AddScoped<Ecommerce.Services.Catalog.Application.Common.Interfaces.IStorageService, Ecommerce.Services.Catalog.Infrastructure.Storage.S3StorageService>();

        return services;
    }
}
