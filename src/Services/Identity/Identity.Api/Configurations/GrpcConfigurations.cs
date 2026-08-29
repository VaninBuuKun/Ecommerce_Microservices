namespace Ecommerce.Services.Identity.Api.Configurations;

public static class GrpcConfigurations
{
    public static void AddGrpcConfigurations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddGrpc();
        AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
        services.AddGrpcClient<BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient>(o =>
        {
            o.Address = new Uri(configuration["Services:SellerGrpcUrl"] ?? throw new InvalidOperationException("SellerGrpcUrl is missing."));
        });
    }
}
