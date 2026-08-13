using Elastic.Ingest.Elasticsearch.DataStreams;
using Microsoft.AspNetCore.Builder;
using Serilog;
using Elastic.Serilog.Sinks;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Trace;
using Serilog.Enrichers.Span;

namespace BuildingBlocks.Logging;

public static class ElasticSearchSerilogExtensions
{
    public static void AddCustomSerilog(this WebApplicationBuilder builder, string applicationName)
    {
        var elasticUri = builder.Configuration["ElasticConfiguration:Uri"] ?? "http://localhost:9200";
        // Khởi tạo bootstrap logger trước
        Log.Logger = new LoggerConfiguration()
            .WriteTo.Console()
            .CreateBootstrapLogger();
        
        Serilog.Debugging.SelfLog.Enable(msg => {
            Console.Error.WriteLine($"SERILOG INTERNAL ERROR: {msg}");
        });

        var cleanAppName = applicationName.ToLower().Replace(" ", "-").Replace(".", "-");
        var environment = builder.Environment.EnvironmentName.ToLower().Replace(".", "-");

        builder.Host.UseSerilog((context, services, configuration) => configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.WithProperty("ApplicationName", applicationName)
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .Enrich.WithSpan() // Thêm Span Enricher để đính kèm TraceId, SpanId
            .WriteTo.Elasticsearch(new[] { new Uri(elasticUri) }, opts =>
            {
                // Cấu hình Data Stream: app-logs-{appName}-{environment} để tên chỉ mục luôn bắt đầu bằng app-logs-*
                opts.DataStream = new DataStreamName("app-logs", cleanAppName, environment);
            })
        );
    }

    public static void AddCustomTracing(this WebApplicationBuilder builder, string serviceName)
    {
        var otlpEndpoint = builder.Configuration["OpenTelemetry:OtlpEndpoint"] ?? "http://localhost:4317";

        builder.Services.AddOpenTelemetry()
            .WithTracing(tracing =>
            {
                tracing
                    .AddSource(serviceName)
                    .SetSampler(new OpenTelemetry.Trace.AlwaysOnSampler())
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        options.RecordException = true;
                    })
                    .AddHttpClientInstrumentation()
                    .AddOtlpExporter(options =>
                    {
                        options.Endpoint = new Uri(otlpEndpoint);
                    });
            });
    }
}