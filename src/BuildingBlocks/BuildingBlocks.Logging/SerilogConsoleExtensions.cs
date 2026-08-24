using Microsoft.AspNetCore.Builder;
using Serilog;

namespace BuildingBlocks.Logging;

public static class SerilogConsoleExtensions
{
    /// <summary>
    /// Cấu hình Serilog ghi log ra Console (stdout) phục vụ Dozzle / Docker logs real-time.
    /// Dùng độc lập cho tất cả các môi trường (Dev, Staging, Production).
    /// </summary>
    public static WebApplicationBuilder AddSerilogConsoleLogging(this WebApplicationBuilder builder)
    {
        Serilog.Debugging.SelfLog.Enable(Console.WriteLine);

        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", Serilog.Events.LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .WriteTo.Console(
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}"
                );
        });

        return builder;
    }
}
