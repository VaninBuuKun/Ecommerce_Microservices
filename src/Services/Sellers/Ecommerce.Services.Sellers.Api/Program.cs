using System.Text.Json.Serialization;
using BuildingBlocks.Logging.OTLPSerilog;
using Ecommerce.Services.Sellers.Api.Configurations;
using Ecommerce.Services.Sellers.Api.GrpcServers;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("SellerService");
// builder.AddCustomTracing("SellerService");
Log.Information("Seller Service starting......");
try
{
    builder.Services.AddOpenApi();
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
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

    app.UseAuthentication();
    app.UseAuthorization();
    
    app.MapGrpcService<SellerGrpcServer>();

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
