using Microsoft.AspNetCore.Builder;

namespace BuildingBlocks.Logging;

[Flags]
public enum LoggingProvider
{
    Console = 1,        // Ghi Console stdout cho Dozzle / Docker Logs
    OtlpLog = 2,        // Gửi Log qua OTLP gRPC đến Collector / Loki
    OtlpTracing = 4,    // Gửi Trace qua OTLP gRPC đến Collector / Tempo
    All = Console | OtlpLog | OtlpTracing
}

public static class CustomLoggingExtensions
{
    /// <summary>
    /// Kích hoạt Logging / Tracing cho Service với khả năng linh hoạt chọn 1 hoặc kết hợp nhiều Provider:
    /// - LoggingProvider.Console (Ghi console cho Dozzle - Mặc định)
    /// - LoggingProvider.OtlpLog (Gửi log OTLP cho Loki)
    /// - LoggingProvider.OtlpTracing (Gửi tracing OTLP cho Tempo - Mặc định)
    /// - LoggingProvider.All (Bật cả 3)
    /// 
    /// Ví dụ chọn 1 provider:
    /// builder.AddCustomSerilog("IdentityService", LoggingProvider.Console);
    /// </summary>
    public static WebApplicationBuilder AddCustomSerilog(
        this WebApplicationBuilder builder,
        string applicationName,
        LoggingProvider providers = LoggingProvider.Console)
    {
        if (providers.HasFlag(LoggingProvider.Console))
        {
            builder.AddSerilogConsoleLogging();
        }

        if (providers.HasFlag(LoggingProvider.OtlpLog))
        {
            builder.AddSerilogOtlpLogging(applicationName);
        }

        if (providers.HasFlag(LoggingProvider.OtlpTracing))
        {
            builder.AddOpenTelemetryTracing(applicationName);
        }

        return builder;
    }
}
