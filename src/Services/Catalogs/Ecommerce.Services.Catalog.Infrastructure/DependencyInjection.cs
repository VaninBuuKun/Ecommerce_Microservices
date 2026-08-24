using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Common.Interfaces;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Infrastructure.GrpcClients;
using Ecommerce.Services.Catalog.Infrastructure.Persistence;
using Ecommerce.Services.Catalog.Infrastructure.Repositories;
using Ecommerce.Services.Catalog.Infrastructure.Storage;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Catalog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        //Db
        var connectionString = configuration.GetConnectionString("Database");

        services.AddDbContext<ProductDbContext>(options =>
            options.UseNpgsql(connectionString));

        
        //External Services
        services.AddMasstransitEventBus(configuration, config =>
        {
            config.AddConsumers(typeof(DependencyInjection).Assembly);
        });
        
        //Grpc
        services.AddGrpc();
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

        services.AddGrpcClient<BuildingBlocks.Grpc.Services.PaymentGrpc.PaymentGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:PaymentGrpcUrl"] ?? throw new InvalidOperationException("PaymentUrl is missing."));
        });
        services.AddGrpcClient<BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:SellerGrpcUrl"] ?? throw new InvalidOperationException("SellerGrpcUrl is missing."));
        });
        services.AddGrpcClient<BuildingBlocks.Grpc.Services.IdentityGrpc.IdentityGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:IdentityGrpcUrl"] ?? throw new InvalidOperationException("IdentityGrpcUrl is missing."));
        });
        services.AddGrpcClient<BuildingBlocks.Grpc.Services.OrderGrpc.OrderGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:OrderGrpcUrl"] ?? "http://localhost:5008");
        });
        
        //Services
        services.AddScoped<ISellerService, SellerClientService>();
        services.AddScoped<IPaymentService, PaymentClientService>();
        services.AddScoped<IIdentityService, IdentityClientService>();
        services.AddScoped<IOrderService, OrderClientService>();
        services.AddScoped<IStorageService,S3StorageService>();
        
        //Repo
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<ProductDbContext>>();
        services.AddScoped<IVariantRepository, VariantRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();

        return services;
    }
}
