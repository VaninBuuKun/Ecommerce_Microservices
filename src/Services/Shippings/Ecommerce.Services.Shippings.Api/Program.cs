using System.Reflection;
using System.Text.Json.Serialization;
using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Logging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Shippings.Api.Persistances;
using Ecommerce.Services.Shippings.Api.Services;
using BuildingBlocks.Messaging;
using Ecommerce.Services.Shippings.Api.Configurations;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;
using Serilog;
using MassTransit;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("ShippingService");
Log.Information("Shipping Service starting......");

try
{
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });
    
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
    
    builder.Services.AddInfrastructureConfiguration(builder.Configuration);

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }
    else
    {
        app.UseHttpsRedirection();
    }
    app.UseCors("CorsPolicy");
    app.MapGrpcService<ShippingGrpcServer>();
    app.MapControllers();

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
