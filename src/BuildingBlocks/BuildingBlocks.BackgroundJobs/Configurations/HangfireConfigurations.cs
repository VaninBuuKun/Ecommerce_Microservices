using System;
using BuildingBlocks.BackgroundJobs.Filters;
using BuildingBlocks.BackgroundJobs.Services;
using BuildingBlocks.Shared.InfrastructureInterfaces.BackgroundJobs;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.BackgroundJobs.Configurations;

public static class HangfireConfigurations
{
    public static IServiceCollection AddBuildingBlocksHangfire(
        this IServiceCollection services,
        IConfiguration configuration,
        string schemaName = "hangfire",
        string connectionStringKey = "Database")
    {
        var connectionString = configuration.GetConnectionString(connectionStringKey)
            ?? throw new InvalidOperationException($"Connection string '{connectionStringKey}' is missing for Hangfire.");

        services.AddHangfire(config =>
        {
            config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString), new PostgreSqlStorageOptions
                {
                    SchemaName = schemaName,
                    PrepareSchemaIfNecessary = true,
                    QueuePollInterval = TimeSpan.FromSeconds(15),
                    InvisibilityTimeout = TimeSpan.FromMinutes(30)
                });
        });

        // Đăng ký Hangfire Server để xử lý background jobs
        services.AddHangfireServer(options =>
        {
            options.WorkerCount = Math.Min(Environment.ProcessorCount * 2, 8);
        });

        // Đăng ký abstraction IBackgroundJobManager
        services.AddSingleton<IBackgroundJobManager, HangfireBackgroundJobManager>();

        return services;
    }

    public static IApplicationBuilder UseBuildingBlocksHangfireDashboard(
        this IApplicationBuilder app,
        string pathMatch = "/hangfire")
    {
        app.UseHangfireDashboard(pathMatch, new DashboardOptions
        {
            Authorization = new[] { new HangfireDashboardAuthorizationFilter() },
            DashboardTitle = "BuuStore Background Jobs Dashboard"
        });

        return app;
    }
}
