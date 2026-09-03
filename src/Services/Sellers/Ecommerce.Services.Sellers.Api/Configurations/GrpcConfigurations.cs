using System;
using BuildingBlocks.Grpc.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Services.Sellers.Api.Configurations;

public static class GrpcConfigurations
{
    public static void AddGrpcConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddBuildingBlocksGrpc();
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
        services.AddGrpcClient<BuildingBlocks.Grpc.Services.ShippingGrpc.ShippingGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:ShippingGrpcUrl"] ?? throw new InvalidOperationException("ShippingGrpcUrl is missing."));
        });
        services.AddGrpcClient<BuildingBlocks.Grpc.Services.PaymentGrpc.PaymentGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:PaymentGrpcUrl"] ?? throw new InvalidOperationException("PaymentGrpcUrl is missing."));
        });
    }
}
