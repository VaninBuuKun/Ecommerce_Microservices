using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace BuildingBlocks.Logging;

public static class OpenTelemetryTracingExtensions
{
    /// <summary>
    /// Cấu hình OpenTelemetry Tracing (HTTP, gRPC, EF Core, AspNetCore) gửi trace data tới Tempo/Jaeger.
    /// </summary>
    public static WebApplicationBuilder AddOpenTelemetryTracing(
        this WebApplicationBuilder builder,
        string applicationName)
    {
        var otelEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]
                        ?? builder.Configuration["Otlp:Endpoint"]
                        ?? "http://localhost:4317";

        builder.Services.AddOpenTelemetry()
            .ConfigureResource(resource =>
            {
                resource.AddService(applicationName, serviceVersion: "1.0.0");
            })
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddGrpcClientInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddEntityFrameworkCoreInstrumentation()
                    .AddOtlpExporter(options =>
                    {
                        options.Endpoint = new Uri(otelEndpoint);
                    });
            });

        return builder;
    }
}
