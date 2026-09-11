using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Recommendations.Api.Models.Interfaces;
using Ecommerce.Services.Recommendations.Api.Persistances;
using Ecommerce.Services.Recommendations.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Recommendations.Api.Configurations;

public static class ServiceConfigurations
{
    public static void AddServiceConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IRecommendationService, RecommendationService>();
        services.AddScoped<IProductViewService, ProductViewService>();
        services.AddScoped<IDataSyncService, DataSyncService>();
        services.AddScoped<IEfUnitOfWork, EfUnitOfWork<RecommendationDbContext>>();
    }
}
