using Ecommerce.Services.Carts.Api.GrpcClients;
using Ecommerce.Services.Carts.Api.Services;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Carts.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IProductService, ProductClientService>();
        services.AddScoped<ISellerService, SellerClientService>();
    }
}
