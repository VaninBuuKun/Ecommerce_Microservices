using BuildingBlocks.Auth;
using BuildingBlocks.Logging.OTLPSerilog;
using Ecommerce.Services.Orders.Infrastructure;
using BuildingBlocks.Web.Extensions;
using Scalar.AspNetCore;
using Ecommerce.Services.Orders.Application;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
// Serilog
builder.Host.UseSerilog();
builder.AddCustomSerilog("OrdersService");
// builder.AddCustomTracing("OrdersService");
Log.Information("Order Service starting......");
try
{
    builder.Services.AddOpenApi();
    builder.Services.AddControllers();
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddBuildingBlocksWeb(builder.Configuration);
    builder.Services.AddBuildingBlocsAuth(builder.Configuration);
    
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplication();

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
catch (Exception ex) {
    Log.Error(ex, "Order Service failed to start");
}
finally{
    Log.Information("Order Service is shutting down...");
    Log.CloseAndFlush();
}