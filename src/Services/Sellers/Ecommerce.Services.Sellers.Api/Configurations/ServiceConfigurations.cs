using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Persistances;
using Ecommerce.Services.Sellers.Api.Services;
using Ecommerce.Services.Sellers.Api.Models.Interfaces;

namespace Ecommerce.Services.Sellers.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<SellerDbContext>>();
        services.AddScoped<IShopService, ShopService>();
        services.AddScoped<IKycService, KycService>();
        services.AddScoped<IShippingService, ShippingService>();
        services.AddScoped<IPaymentService, PaymentService>();
    }
}
