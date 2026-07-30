using System.Reflection;
using System.Text.Json.Serialization;
using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.EfCore;
using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Logging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Shippings.Api.Persistances;
using Ecommerce.Services.Shippings.Api.Services;
using BuildingBlocks.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;
using Serilog;
using MassTransit;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("shippingApi");
Log.Information("Shipping Service starting......");

try
{
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

    var connectionString = builder.Configuration.GetConnectionString("Database");
    builder.Services.AddHttpContextAccessor();
    
    builder.Services.AddDbContext<ShippingDbContext>(options =>
        options.UseNpgsql(connectionString));

    builder.Services.AddScoped<GhnShippingProvider>();
    builder.Services.AddScoped<IShippingProvider>(sp => sp.GetRequiredService<GhnShippingProvider>()); // Mặc định kế thừa cũ
    builder.Services.AddScoped<IShippingProviderFactory, ShippingProviderFactory>();
    builder.Services.AddScoped<ILocationService, LocationService>();
    builder.Services.AddScoped<IEfUnitOfWork, EfUnitOfWork<ShippingDbContext>>();
    builder.Services.AddHttpClient<GhnShippingProvider>();
    
    builder.Services.AddGrpcClient<BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:SellerGrpcUrl"] ?? "http://localhost:5043");
    });
    // builder.Services.AddHostedService<LocationSyncJob>();

    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    // BuildingBlocks
    builder.Services.AddGrpc();
    builder.Services.AddBuildingBlocksWeb(builder.Configuration);
    
    builder.Services.AddMasstransitEventBus(builder.Configuration, config =>
    {
        config.AddConsumers(Assembly.GetExecutingAssembly());
        config.AddEntityFrameworkOutbox<ShippingDbContext>(o =>
        {
            o.UsePostgres();
            o.UseBusOutbox();
        });
    });

    builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocsAuth(builder.Configuration);
    builder.Services.AddBuildingBlocksApplication(Assembly.GetExecutingAssembly());

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseHttpsRedirection();
    app.UseCors("CorsPolicy");
    app.MapGrpcService<ShippingGrpcServer>();
    app.MapControllers();
    //
    // // Automatically apply migrations in dev environment
    // using (var scope = app.Services.CreateScope())
    // {
    //     var db = scope.ServiceProvider.GetRequiredService<ShippingDbContext>();
    //     db.Database.Migrate();
    // }

    app.Run();
}
catch (Exception ex)
{
    Log.Error(ex, "Shipping Service failed to start");
}
finally
{
    Log.Information("Shipping Service is shutting down...");
    Log.CloseAndFlush();
}
