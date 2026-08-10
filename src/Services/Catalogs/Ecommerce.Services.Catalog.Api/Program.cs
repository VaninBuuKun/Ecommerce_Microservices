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
builder.AddCustomTracing("CatalogService");
try
{
    //MyDI
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
    builder.Services.AddOpenApi();
    builder.Services.AddGrpc();

    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplicationServices();
    builder.Services.AddScoped<IVariantRepository, VariantRepository>();
    builder.Services.AddScoped<IProductRepository, ProductRepository>();
    builder.Services.AddScoped<Ecommerce.Services.Catalog.Application.Commons.Interfaces.ISellerService, Ecommerce.Services.Catalog.Infrastructure.GrpcClients.SellerClientService>();
    builder.Services.AddScoped<Ecommerce.Services.Catalog.Application.Commons.Interfaces.IPaymentService, Ecommerce.Services.Catalog.Infrastructure.GrpcClients.PaymentClientService>();

//BuildingBlocks
    
    builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
    builder.Services.AddBuildingBlocksWeb(builder.Configuration);
    builder.Services.AddBuildingBlocsAuth(builder.Configuration);

    AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
    builder.Services.AddGrpcClient<BuildingBlocks.Grpc.Services.SellerGrpc.SellerGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:SellerGrpcUrl"] ?? "http://localhost:5043");
    });
    builder.Services.AddGrpcClient<BuildingBlocks.Grpc.Services.PaymentGrpc.PaymentGrpcClient>(o =>
    {
        o.Address = new Uri(builder.Configuration["Services:PaymentGrpcUrl"] ?? "http://localhost:5053");
    });

    var app = builder.Build();
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.UseHttpsRedirection();
    app.UseSerilogRequestLogging();
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
