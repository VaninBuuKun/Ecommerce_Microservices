using BuildingBlocks.Auth;
using BuildingBlocks.Logging;
using BuildingBlocks.EfCore;
using Ecommerce.Services.Orders.Infrastructure;
using BuildingBlocks.Web.Extensions;
using Scalar.AspNetCore;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Orders.Application;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Infrastructure.GrpcClients;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.AddCustomSerilog("OrdersService");
Log.Information("Order Service starting......");
try
{
    // OpenAPI
    builder.Services.AddOpenApi();
    builder.Services.AddControllers();
    builder.Services.AddHttpContextAccessor();

    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocksWeb(builder.Configuration);
    builder.Services.AddBuildingBlocsAuth(builder.Configuration);
    builder.Services.AddApplicationServices();
    builder.AddCustomSerilog("orderApi");

// gRPC Clients
    AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
    builder.Services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:ProductGrpcUrl"] ?? throw new InvalidOperationException("ProductGrpcUrl is missing."));
    });
    builder.Services.AddGrpcClient<CartGrpc.CartGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:CartGrpcUrl"] ?? throw new InvalidOperationException("CartGrpcUrl is missing."));
    });
    builder.Services.AddGrpcClient<PaymentGrpc.PaymentGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:PaymentGrpcUrl"] ?? throw new InvalidOperationException("PaymentGrpcUrl is missing."));
    });
    builder.Services.AddGrpcClient<SellerGrpc.SellerGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:SellerGrpcUrl"] ?? throw new InvalidOperationException("SellerGrpcUrl is missing."));
    });
    builder.Services.AddGrpcClient<IdentityGrpc.IdentityGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:IdentityGrpcUrl"] ?? throw new InvalidOperationException("IdentityGrpcUrl is missing."));
    });
    builder.Services.AddGrpcClient<ShippingGrpc.ShippingGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:ShippingGrpcUrl"] ?? throw new InvalidOperationException("ShippingGrpcUrl is missing."));
    });


    builder.Services.AddScoped<ICartService, CartClientService>();
    builder.Services.AddScoped<IProductService, ProductClientService>();
    builder.Services.AddScoped<IPaymentService, PaymentClientService>();
    builder.Services.AddScoped<ISellerService, SellerClientService>();
    builder.Services.AddScoped<IIdentityService, IdentityClientService>();
    builder.Services.AddScoped<IShippingService, ShippingClientService>();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseHttpsRedirection();
    app.UseCors("CorsPolicy");
    app.MapControllers();

    app.Run();

}
catch (Exception ex) {
    Log.Error(ex, "Order Service failed to start");
}
finally{
    Log.Information("Order Service is shutting down...");
    Log.CloseAndFlush();
}