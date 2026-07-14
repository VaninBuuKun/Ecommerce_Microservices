using Elastic.Ingest.Elasticsearch.DataStreams;
using Microsoft.AspNetCore.Builder;
using Serilog;
using Elastic.Serilog.Sinks;

namespace BuildingBlocks.Logging;

public static class SerilogExtensions
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
            .WriteTo.Elasticsearch(new[] { new Uri(elasticUri) }, opts =>
            {
                // Cấu hình Data Stream chính chủ của Elastic: logs-{dataset}-{namespace}
                opts.DataStream = new DataStreamName("logs", cleanAppName, environment);
            })
        );
    }
}