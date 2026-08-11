using BuildingBlocks.Auth;
using BuildingBlocks.Logging.OTLPSerilog;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Catalog.Infrastructure;
using Ecommerce.Services.Catalog.Api.GrpcServers;
using Ecommerce.Services.Catalog.Application;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("CatalogService");
// builder.AddCustomTracing("CatalogService");
try
{
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
    builder.Services.AddOpenApi();
    

    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplicationServices();
    
    
    builder.Services.AddBuildingBlocksWeb(builder.Configuration);
    builder.Services.AddBuildingBlocsAuth(builder.Configuration);
    

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
    app.MapGrpcService<ProductGrpcService>();
    app.MapControllers();
    app.Run();
}
catch (Exception ex) {
    Log.Error(ex, "Catalog Service failed to start");
}
finally{
    Log.Information("Catalog Service is shutting down...");
    Log.CloseAndFlush();
}
