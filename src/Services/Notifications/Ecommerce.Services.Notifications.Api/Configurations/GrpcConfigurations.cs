using System;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Notifications.Api.Configurations;

public static class GrpcConfigurations
{
    public static void AddGrpcConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
        services.AddGrpcClient<IdentityGrpc.IdentityGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:IdentityGrpcUrl"] ?? throw new InvalidOperationException("IdentityGrpcUrl is missing"));
        });
        services.AddGrpcClient<SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:SellerGrpcUrl"] ?? throw new InvalidOperationException("SellerGrpcUrl is missing"));
        });
        services.AddBuildingBlocksGrpc();
    }
}
