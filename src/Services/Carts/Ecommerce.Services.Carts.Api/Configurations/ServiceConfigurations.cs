using Ecommerce.Services.Carts.Api.GrpcClients;
using Ecommerce.Services.Carts.Api.Models.Interfaces;

namespace Ecommerce.Services.Carts.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IProductService, ProductClientService>();
        services.AddScoped<ISellerService, SellerClientService>();
        
    }
}