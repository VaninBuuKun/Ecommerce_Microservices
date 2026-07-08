using System.Reflection;
using System.Text.Json.Serialization;
using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.EfCore;
using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Logging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Ecommerce.Services.Payments.Api.Models.Settings;
using Ecommerce.Services.Payments.Api.Persistances;
using Ecommerce.Services.Payments.Api.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

//MyDi
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
var connectionString = builder.Configuration.GetConnectionString("Database");

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IEfUnitOfWork, EfUnitOfWork<PaymentDbContext>>();
builder.Services.AddScoped<PaymentGatewayFactory>();
builder.Services.AddScoped<IPaymentGateway, MomoPaymentGateway>();
builder.Services.AddScoped<IPaymentGateway, CODPaymentGateway>();
builder.Services.AddHttpClient();
builder.Services.Configure<MomoSettings>(builder.Configuration.GetSection("Momo"));



//BuildingBlocks
builder.Services.AddBuildingBlocksWeb();
builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
builder.Services.AddBuildingBlocsAuth(builder.Configuration);
builder.Services.AddBuildingBlocksApplication(Assembly.GetExecutingAssembly());
builder.AddCustomSerilog("Payments");


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();