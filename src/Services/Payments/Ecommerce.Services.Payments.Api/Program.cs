using System.Text.Json.Serialization;
using BuildingBlocks.Logging;
using Ecommerce.Services.Payments.Api.Models.Settings;
using Ecommerce.Services.Payments.Api.Configurations;
using Ecommerce.Services.Payments.Api.GrpcServers;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddCustomSerilog("PaymentService");
builder.AddCustomTracing("PaymentService");
Log.Information("Payment Service starting......");
try
{
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });
    
    
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
    app.MapGrpcService<PaymentGrpcServer>();
    app.MapControllers();
    app.Run();
}
catch (Exception ex) {
    Log.Error(ex, "Payment Service failed to start");
}
finally{
    Log.Information("Payment Service is shutting down...");
    Log.CloseAndFlush();
}