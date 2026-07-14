using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.Caching;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Logging;
using BuildingBlocks.Messaging;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Carts.Api.Endpoints;
using Ecommerce.Services.Carts.Api.GrpcServers;
using Ecommerce.Services.Carts.Api.Models.Interfaces;
using Ecommerce.Services.Carts.Api.GrpcClients;
using MassTransit;
using Mapster;
using MapsterMapper;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("CartApi");
try
{
    //MyDI
    builder.Services.AddScoped<IProductService, ProductClientService>();
    builder.Services.AddHttpContextAccessor();

//BuildingBlocks
    builder.Services.AddCustomCaching(builder.Configuration.GetConnectionString("Redis") ?? throw new InvalidOperationException("RedisConnectionString is missing."));
    builder.Services.AddBuildingBlocksWeb();
    builder.Services.AddMasstransitEventBus(builder.Configuration);
    builder.Services.AddBuildingBlocksApplication(typeof(Program).Assembly);

//Grpc
    AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
    builder.Services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:ProductGrpcUrl"]);
    });
    builder.Services.AddGrpc();

    builder.Services.AddBuildingBlocksApplication(typeof(Program).Assembly);

    builder.Services.AddBuildingBlocsAuth(builder.Configuration);
    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseAuthentication();
    app.UseAuthorization();

    app.AddMappingEndpoints();

    app.MapGrpcService<CartGrpcService>();

    app.MapGet("/health", () =>
    {
        var instanceName = Environment.GetEnvironmentVariable("INSTANCE_NAME") ?? "Unknown-Instance";
        return Results.Ok($"Cart {instanceName} OK");
    });

    app.UseHttpsRedirection();

    app.Run();

}
catch (Exception ex) {
    Log.Error(ex, "Identity Service failed to start");
}
finally{
    Log.Information("Identity Service is shutting down...");
    Log.CloseAndFlush();
}
