using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Shippings.Api.Persistances;
using Ecommerce.Services.Shippings.Api.Services;
using Ecommerce.Services.Shippings.Api.Models.Interfaces;

namespace Ecommerce.Services.Shippings.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<GhnShippingProvider>();
        services.AddScoped<IShippingProvider>(sp => sp.GetRequiredService<GhnShippingProvider>()); // Mặc định kế thừa cũ
        services.AddScoped<IShippingProviderFactory, ShippingProviderFactory>();
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<IShippingAppService, ShippingAppService>();
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<ShippingDbContext>>();
        services.AddHttpClient<GhnShippingProvider>();
    }
}
