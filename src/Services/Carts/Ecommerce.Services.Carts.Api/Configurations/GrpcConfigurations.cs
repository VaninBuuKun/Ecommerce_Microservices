using BuildingBlocks.Grpc.Services;

namespace Ecommerce.Services.Carts.Api.Configurations;

public static class GrpcConfigurations
{
    public static void AddGrpcConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
        services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:ProductGrpcUrl"]);
        });
        services.AddGrpcClient<SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:SellerGrpcUrl"]);
        });
        services.AddGrpc();
    }
}
