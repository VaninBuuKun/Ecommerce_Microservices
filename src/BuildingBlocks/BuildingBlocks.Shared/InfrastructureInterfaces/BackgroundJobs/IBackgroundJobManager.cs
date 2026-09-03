using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace BuildingBlocks.Shared.InfrastructureInterfaces.BackgroundJobs;

/// <summary>
/// Trừu tượng hóa việc quản lý Background Job (Fire-and-forget, Delayed, Recurring, Cancel).
/// Giúp Application & Domain layer độc lập hoàn toàn với framework bên dưới (Hangfire, Quartz, Temporal...).
/// </summary>
public interface IBackgroundJobManager
{
    // ==========================================
    // 1. FIRE-AND-FORGET JOBS
    // ==========================================
    string Enqueue(Expression<Action> methodCall);
    string Enqueue<T>(Expression<Action<T>> methodCall);
    string Enqueue(Expression<Func<Task>> methodCall);
    string Enqueue<T>(Expression<Func<T, Task>> methodCall);

    // ==========================================
    // 2. DELAYED / SCHEDULED JOBS
    // ==========================================
    string Schedule(Expression<Action> methodCall, TimeSpan delay);
    string Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay);
    string Schedule(Expression<Func<Task>> methodCall, TimeSpan delay);
    string Schedule<T>(Expression<Func<T, Task>> methodCall, TimeSpan delay);

    string Schedule(Expression<Action> methodCall, DateTimeOffset enqueueAt);
    string Schedule<T>(Expression<Action<T>> methodCall, DateTimeOffset enqueueAt);
    string Schedule(Expression<Func<Task>> methodCall, DateTimeOffset enqueueAt);
    string Schedule<T>(Expression<Func<T, Task>> methodCall, DateTimeOffset enqueueAt);

    // ==========================================
    // 3. RECURRING CRON JOBS
    // ==========================================
    void AddOrUpdateRecurring(string recurringJobId, Expression<Action> methodCall, string cronExpression);
    void AddOrUpdateRecurring<T>(string recurringJobId, Expression<Action<T>> methodCall, string cronExpression);
    void AddOrUpdateRecurring(string recurringJobId, Expression<Func<Task>> methodCall, string cronExpression);
    void AddOrUpdateRecurring<T>(string recurringJobId, Expression<Func<T, Task>> methodCall, string cronExpression);

    void RemoveRecurring(string recurringJobId);

    // ==========================================
    // 4. CANCEL / DELETE JOB
    // ==========================================
    bool Delete(string jobId);
}
