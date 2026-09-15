using System;
using System.Text.Json.Serialization;
using BuildingBlocks.Logging;
using Ecommerce.Services.Analytics.Api.Configurations;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("AnalyticsService");

Log.Information("Analytics Service starting......");
try
{
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            options.JsonSerializerOptions.Converters.Add(new BuildingBlocks.Shared.Converters.LongToStringJsonConverter());
            options.JsonSerializerOptions.Converters.Add(new BuildingBlocks.Shared.Converters.NullableLongToStringJsonConverter());
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
    app.MapControllers();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Error(ex, "Analytics Service failed to start");
}
finally
{
    Log.Information("Analytics Service is shutting down...");
    Log.CloseAndFlush();
}
