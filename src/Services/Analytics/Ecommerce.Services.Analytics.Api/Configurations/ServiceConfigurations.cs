using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Analytics.Api.Models.Interfaces;
using Ecommerce.Services.Analytics.Api.Persistances;
using Ecommerce.Services.Analytics.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Analytics.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ISellerAnalyticsService, SellerAnalyticsService>();
        services.AddScoped<IAdminAnalyticsService, AdminAnalyticsService>();
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<AnalyticsDbContext>>();
    }
}
