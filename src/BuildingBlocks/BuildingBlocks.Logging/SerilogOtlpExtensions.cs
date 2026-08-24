using Microsoft.AspNetCore.Builder;
using Serilog;
using Serilog.Events;

namespace BuildingBlocks.Logging;

public static class SerilogOtlpExtensions
{
    /// <summary>
    /// Cấu hình Serilog gửi log dạng OTLP gRPC đến OpenTelemetry Collector / Loki.
    /// Tự động đọc cấu hình OTEL_EXPORTER_OTLP_ENDPOINT từ Environment / Configuration.
    /// </summary>
    public static WebApplicationBuilder AddSerilogOtlpLogging(
        this WebApplicationBuilder builder,
        string applicationName)
    {
        Serilog.Debugging.SelfLog.Enable(Console.WriteLine);

        builder.Host.UseSerilog((context, services, configuration) =>
        {
            var otelEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]
                            ?? builder.Configuration["Otlp:Endpoint"]
                            ?? "http://localhost:4317";

            configuration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .WriteTo.OpenTelemetry(options =>
                {
                    options.Endpoint = otelEndpoint;
                    options.Protocol = Serilog.Sinks.OpenTelemetry.OtlpProtocol.Grpc;
                    options.ResourceAttributes = new Dictionary<string, object>
                    {
                        { "service.name", applicationName },
                        { "service.version", "1.0.0" },
                        { "deployment.environment", builder.Environment.EnvironmentName }
                    };
                });
        });

        return builder;
    }
}
