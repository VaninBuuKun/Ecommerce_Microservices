using System;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Payments.Api.Configurations;

public static class GrpcConfigurations
{
    public static void AddGrpcConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddBuildingBlocksGrpc();
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
        services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:ProductGrpcUrl"] ?? throw new InvalidOperationException("ProductGrpc url is missing."));
        });
        services.AddGrpcClient<SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:SellerGrpcUrl"] ??  throw new InvalidOperationException("SellerGrpc url is missing."));
        });
    }
}
