using System.Reflection;
using BuildingBlocks.Application;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Orders.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddBuildingBlocksApplication(Assembly.GetExecutingAssembly());
        return services;
    }
}