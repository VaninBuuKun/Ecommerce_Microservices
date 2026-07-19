using BuildingBlocks.Auth;
using BuildingBlocks.Logging;
using BuildingBlocks.EfCore;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Catalog.Infrastructure;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProducts;
using Ecommerce.Services.Catalog.Api.GrpcServers;
using Ecommerce.Services.Catalog.Application;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Infrastructure.Repositories;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("catalogApi");
try
{
    //MyDI
    builder.Services.AddControllers();
    builder.Services.AddOpenApi();
    builder.Services.AddGrpc();

    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplicationServices();
    builder.Services.AddScoped<IVariantRepository, VariantRepository>();
    builder.Services.AddScoped<Ecommerce.Services.Catalog.Application.Commons.Interfaces.ISellerService, Ecommerce.Services.Catalog.Infrastructure.GrpcClients.SellerClientService>();

//BuildingBlocks
    
    builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocksWeb();
    builder.Services.AddBuildingBlocsAuth(builder.Configuration);

    AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
    builder.Services.AddGrpcClient<BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:SellerGrpcUrl"] ?? "http://localhost:5043");
    });

    var app = builder.Build();
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseHttpsRedirection();
    app.UseSerilogRequestLogging();
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
