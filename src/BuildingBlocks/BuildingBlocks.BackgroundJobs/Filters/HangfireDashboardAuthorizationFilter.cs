using Hangfire.Dashboard;

namespace BuildingBlocks.BackgroundJobs.Filters;

public class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Cho phép truy cập từ localhost / dev hoặc user có role Admin
        if (httpContext.Request.Host.Host == "localhost" || httpContext.Request.Host.Host == "127.0.0.1")
        {
            return true;
        }

        return httpContext.User.Identity?.IsAuthenticated == true && httpContext.User.IsInRole("Admin");
    }
}
