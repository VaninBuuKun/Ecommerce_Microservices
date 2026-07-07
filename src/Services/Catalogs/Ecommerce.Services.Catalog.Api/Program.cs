using BuildingBlocks.Auth;
using BuildingBlocks.Logging;
using BuildingBlocks.EfCore;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Catalog.Infrastructure;
using Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProducts;
using Ecommerce.Services.Catalog.Api.GrpcServers;
using Ecommerce.Services.Catalog.Application;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

//MyDI
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddGrpc();

//Layers
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplicationServices();

//BuildingBlocks
builder.AddCustomSerilog("Product Services");
builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
builder.Services.AddBuildingBlocksWeb();
builder.Services.AddBuildingBlocsAuth(builder.Configuration);

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