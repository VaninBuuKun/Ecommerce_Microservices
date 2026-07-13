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
using BuildingBlocks.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

//MyDi
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddGrpc();
var connectionString = builder.Configuration.GetConnectionString("Database");
builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IEfUnitOfWork, EfUnitOfWork<PaymentDbContext>>();
builder.Services.AddScoped<PaymentGatewayFactory>();
builder.Services.AddScoped<IPaymentGateway, MomoPaymentGateway>();
builder.Services.AddScoped<IPaymentGateway, CODPaymentGateway>();
builder.Services.AddScoped<IPaymentGateway, VNPayPaymentGateway>();
builder.Services.AddHttpClient();
builder.Services.Configure<MomoSettings>(builder.Configuration.GetSection("Momo"));
builder.Services.Configure<VNPaySettings>(builder.Configuration.GetSection("VNPay"));
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    //XForwardedFor: Chứa ip client, XForwardedProto chứa giao thức sử dụng (http, https)
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    
    //Mục tiêu là: chỉ tin trường x-forwarded-for từ proxy có ip trong whilist thôi.
    //Clear: cho môi trường dev kiểu các proxy có ip thay đổi do docker compose up, docker compose down
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});



//BuildingBlocks
builder.Services.AddBuildingBlocksWeb();
builder.Services.AddMasstransitEventBus(builder.Configuration);
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
app.MapGrpcService<Ecommerce.Services.Payments.Api.GrpcServers.PaymentGrpcService>();
app.MapControllers();
app.Run();