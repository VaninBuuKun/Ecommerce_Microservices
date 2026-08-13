using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Events;

namespace BuildingBlocks.Logging.OTLPSerilog;

public static class OTLPSerilogExtension
{
    public static void AddCustomSerilog(
        this WebApplicationBuilder builder,
        string applicationName)
    {
        Serilog.Debugging.SelfLog.Enable(Console.WriteLine);

        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .MinimumLevel.Information()

                .MinimumLevel.Override(
                    "Microsoft.EntityFrameworkCore",
                    LogEventLevel.Warning)

                .MinimumLevel.Override(
                    "Microsoft.EntityFrameworkCore.Database.Command",
                    LogEventLevel.Warning)

                .Enrich.FromLogContext()

                .WriteTo.OpenTelemetry(options =>
                {
                    options.Endpoint =
                        "http://localhost:4317";

                    options.Protocol =
                        Serilog.Sinks.OpenTelemetry
                            .OtlpProtocol.Grpc;

                    options.ResourceAttributes = new Dictionary<string, object>
                    {
                        { "service.name", applicationName },
                        { "service.version", "1.0.0" },
                        { "deployment.environment", builder.Environment.EnvironmentName },
                    };
                });
            
            if (builder.Environment.IsDevelopment())
            {
                configuration.WriteTo.Console();
            }
        });
        
        builder.Services.AddOpenTelemetry().ConfigureResource(resource =>
        {
            resource.AddService(applicationName, serviceVersion: "1.0,0");
        }).WithTracing(tracing =>
        {
            tracing
                .AddAspNetCoreInstrumentation()
                .AddGrpcClientInstrumentation()
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation()
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri("http://localhost:4317");
                });
        });
    }
}