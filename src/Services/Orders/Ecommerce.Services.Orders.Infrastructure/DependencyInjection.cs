using System.Reflection;
using BuildingBlocks.Caching;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Ecommerce.Services.Orders.Infrastructure.Persistence;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Infrastructure.BackgroundServices;
using Ecommerce.Services.Orders.Infrastructure.GrpcClients;
using Ecommerce.Services.Orders.Infrastructure.Sagas;
using Ecommerce.Services.Orders.Infrastructure.Repositories;
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
        
        //Grpc
        services.AddGrpc();
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
        services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:ProductGrpcUrl"] ?? throw new InvalidOperationException("ProductGrpcUrl is missing."));
        });
        services.AddGrpcClient<CartGrpc.CartGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:CartGrpcUrl"] ?? throw new InvalidOperationException("CartGrpcUrl is missing."));
        });
        services.AddGrpcClient<PaymentGrpc.PaymentGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:PaymentGrpcUrl"] ?? throw new InvalidOperationException("PaymentGrpcUrl is missing."));
        });
        services.AddGrpcClient<SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:SellerGrpcUrl"] ?? throw new InvalidOperationException("SellerGrpcUrl is missing."));
        });
        services.AddGrpcClient<IdentityGrpc.IdentityGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:IdentityGrpcUrl"] ?? throw new InvalidOperationException("IdentityGrpcUrl is missing."));
        });
        services.AddGrpcClient<ShippingGrpc.ShippingGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:ShippingGrpcUrl"] ?? throw new InvalidOperationException("ShippingGrpcUrl is missing."));
        });
        
        
        //Services
        services.AddScoped<ICartService, CartClientService>();
        services.AddScoped<IProductService, ProductClientService>();
        services.AddScoped<IPaymentService, PaymentClientService>();
        services.AddScoped<ISellerService, SellerClientService>();
        services.AddScoped<IIdentityService, IdentityClientService>();
        services.AddScoped<IShippingService, ShippingClientService>();
        services.AddScoped<IVoucherValidationService, VoucherValidationService>();
        services.AddScoped<IVoucherRepository, VoucherRepository>();
        
        //Repo
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<OrderDbContext>>();
        services.AddHostedService<AutoCompleteOrdersBackgroundService>();
        
        return services;
    }
}
