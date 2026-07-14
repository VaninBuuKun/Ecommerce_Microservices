using BuildingBlocks.Auth;
using BuildingBlocks.Logging;
using BuildingBlocks.EfCore;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Orders.Infrastructure;
using BuildingBlocks.Web.Extensions;
using Mapster;
using MapsterMapper;
using Scalar.AspNetCore;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Orders.Application;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Infrastructure.GrpcClients;
using MassTransit;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.AddCustomSerilog("OrdersService");
Log.Information("Identity Service starting......");
try
{
    // OpenAPI
    builder.Services.AddOpenApi();
    builder.Services.AddControllers();
    builder.Services.AddHttpContextAccessor();

    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocksWeb();
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


    builder.Services.AddScoped<ICartService, CartClientService>();
    builder.Services.AddScoped<IProductService, ProductClientService>();
    builder.Services.AddScoped<IPaymentService, PaymentClientService>();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.MapControllers();
    app.UseHttpsRedirection();

    app.Run();

}
catch (Exception ex) {
    Log.Error(ex, "Order Service failed to start");
}
finally{
    Log.Information("Order Service is shutting down...");
    Log.CloseAndFlush();
}