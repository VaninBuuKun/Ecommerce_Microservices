using System;
using System.Reflection;
using System.Text.Json.Serialization;
using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.EfCore;
using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Logging;
using BuildingBlocks.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Sellers.Api.GrpcServers;
using Ecommerce.Services.Sellers.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;
using MassTransit;

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.AddCustomSerilog("sellerApi");
    Log.Information("Seller Service starting......");
    // Cấu hình Controllers
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

    builder.Services.AddGrpc();
    builder.Services.AddHttpContextAccessor();

    // Cấu hình Database PostgreSQL
    var connectionString = builder.Configuration.GetConnectionString("Database");
    builder.Services.AddDbContext<SellerDbContext>(options =>
        options.UseNpgsql(connectionString));

    // Cấu hình Unit of Work
    builder.Services.AddScoped<IEfUnitOfWork, EfUnitOfWork<SellerDbContext>>();

    builder.Services.AddGrpcClient<BuildingBlocks.Grpc.Services.ShippingGrpc.ShippingGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:ShippingGrpcUrl"] ?? "http://localhost:5071");
    });
    builder.Services.AddGrpcClient<BuildingBlocks.Grpc.Services.PaymentGrpc.PaymentGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:PaymentGrpcUrl"] ?? "http://localhost:5053");
    });
    builder.Services.AddScoped<Ecommerce.Services.Sellers.Api.Services.IShippingService, Ecommerce.Services.Sellers.Api.Services.ShippingService>();
    builder.Services.AddScoped<Ecommerce.Services.Sellers.Api.Services.IPaymentService, Ecommerce.Services.Sellers.Api.Services.PaymentService>();

    // Cấu hình Building Blocks
    builder.Services.AddBuildingBlocksWeb(builder.Configuration);
    builder.Services.AddMasstransitEventBus(builder.Configuration, config =>
    {
        config.AddEntityFrameworkOutbox<SellerDbContext>(o =>
        {
            o.UsePostgres();
            o.UseBusOutbox();
        });
    });
    builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocsAuth(builder.Configuration);
    builder.Services.AddBuildingBlocksApplication(Assembly.GetExecutingAssembly());

    builder.Services.AddOpenApi();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseHttpsRedirection();

    app.UseCors("CorsPolicy");

    app.UseAuthentication();
    app.UseAuthorization();

    // Map gRPC Server
    app.MapGrpcService<SellerGrpcService>();

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("CRITICAL EXCEPTION ON STARTUP: " + ex.ToString());
    Log.Error(ex, "Seller Service failed to start");
}
finally
{
    Log.Information("Seller Service is shutting down...");
    Log.CloseAndFlush();
}
