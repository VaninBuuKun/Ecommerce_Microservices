using BuildingBlocks.Logging;
using Ecommerce.Services.Carts.Api.Configurations;
using Ecommerce.Services.Carts.Api.Endpoints;
using Ecommerce.Services.Carts.Api.GrpcServers;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("CartService");
builder.AddCustomTracing("CartService");
try
{
    builder.Services.AddHttpContextAccessor();
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

    app.AddMappingEndpoints();
    app.MapGrpcService<CartGrpcServer>();

    app.Run();

}
catch (Exception ex) {
    Log.Error(ex, "Cart Service failed to start");
}
finally{
    Log.Information("Cart Service is shutting down...");
    Log.CloseAndFlush();
}
