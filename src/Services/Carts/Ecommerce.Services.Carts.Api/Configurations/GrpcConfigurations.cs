using System;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Carts.Api.Configurations;

public static class GrpcConfigurations
{
    public static void AddGrpcConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
        services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:ProductGrpcUrl"] ?? throw new InvalidOperationException("ProductGrpcUrl is missing."));
        });
        services.AddGrpcClient<SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:SellerGrpcUrl"] ?? throw new InvalidOperationException("SellerGrpcUrl is missing."));
        });
        services.AddGrpcClient<OrderGrpc.OrderGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:OrderGrpcUrl"] ?? throw new InvalidOperationException("OrderGrpcUrl is missing."));
        });
        services.AddBuildingBlocksGrpc();
    }
}
