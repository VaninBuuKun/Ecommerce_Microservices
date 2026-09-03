using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using BuildingBlocks.Shared.InfrastructureInterfaces.BackgroundJobs;
using Hangfire;

namespace BuildingBlocks.BackgroundJobs.Services;

public class HangfireBackgroundJobManager : IBackgroundJobManager
{
    // ==========================================
    // 1. FIRE-AND-FORGET JOBS
    // ==========================================
    public string Enqueue(Expression<Action> methodCall)
    {
        return BackgroundJob.Enqueue(methodCall);
    }

    public string Enqueue<T>(Expression<Action<T>> methodCall)
    {
        return BackgroundJob.Enqueue(methodCall);
    }

    public string Enqueue(Expression<Func<Task>> methodCall)
    {
        return BackgroundJob.Enqueue(methodCall);
    }

    public string Enqueue<T>(Expression<Func<T, Task>> methodCall)
    {
        return BackgroundJob.Enqueue(methodCall);
    }

    // ==========================================
    // 2. DELAYED / SCHEDULED JOBS
    // ==========================================
    public string Schedule(Expression<Action> methodCall, TimeSpan delay)
    {
        return BackgroundJob.Schedule(methodCall, delay);
    }

    public string Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay)
    {
        return BackgroundJob.Schedule(methodCall, delay);
    }

    public string Schedule(Expression<Func<Task>> methodCall, TimeSpan delay)
    {
        return BackgroundJob.Schedule(methodCall, delay);
    }

    public string Schedule<T>(Expression<Func<T, Task>> methodCall, TimeSpan delay)
    {
        return BackgroundJob.Schedule(methodCall, delay);
    }

    public string Schedule(Expression<Action> methodCall, DateTimeOffset enqueueAt)
    {
        return BackgroundJob.Schedule(methodCall, enqueueAt);
    }

    public string Schedule<T>(Expression<Action<T>> methodCall, DateTimeOffset enqueueAt)
    {
        return BackgroundJob.Schedule(methodCall, enqueueAt);
    }

    public string Schedule(Expression<Func<Task>> methodCall, DateTimeOffset enqueueAt)
    {
        return BackgroundJob.Schedule(methodCall, enqueueAt);
    }

    public string Schedule<T>(Expression<Func<T, Task>> methodCall, DateTimeOffset enqueueAt)
    {
        return BackgroundJob.Schedule(methodCall, enqueueAt);
    }

    // ==========================================
    // 3. RECURRING CRON JOBS
    // ==========================================
    public void AddOrUpdateRecurring(string recurringJobId, Expression<Action> methodCall, string cronExpression)
    {
        RecurringJob.AddOrUpdate(recurringJobId, methodCall, cronExpression);
    }

    public void AddOrUpdateRecurring<T>(string recurringJobId, Expression<Action<T>> methodCall, string cronExpression)
    {
        RecurringJob.AddOrUpdate(recurringJobId, methodCall, cronExpression);
    }

    public void AddOrUpdateRecurring(string recurringJobId, Expression<Func<Task>> methodCall, string cronExpression)
    {
        RecurringJob.AddOrUpdate(recurringJobId, methodCall, cronExpression);
    }

    public void AddOrUpdateRecurring<T>(string recurringJobId, Expression<Func<T, Task>> methodCall, string cronExpression)
    {
        RecurringJob.AddOrUpdate(recurringJobId, methodCall, cronExpression);
    }

    public void RemoveRecurring(string recurringJobId)
    {
        RecurringJob.RemoveIfExists(recurringJobId);
    }

    // ==========================================
    // 4. CANCEL / DELETE JOB
    // ==========================================
    public bool Delete(string jobId)
    {
        return BackgroundJob.Delete(jobId);
    }
}
