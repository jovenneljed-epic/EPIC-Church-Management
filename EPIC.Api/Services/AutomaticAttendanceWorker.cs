using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace EPIC.Api.Services;

public static class AutomaticAttendanceRules
{
    public static bool HasEnded(ChurchService service, DateTime now)
    {
        if (string.Equals(service.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase) || service.ServiceDate.Date > now.Date) return false;
        if (string.Equals(service.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase)) return true;
        if (!TimeSpan.TryParse(service.StartTime, CultureInfo.InvariantCulture, out var start) ||
            !TimeSpan.TryParse(service.EndTime, CultureInfo.InvariantCulture, out var end) ||
            start < TimeSpan.Zero || start >= TimeSpan.FromDays(1) || end < TimeSpan.Zero || end >= TimeSpan.FromDays(1)) return false;
        var deadline = service.ServiceDate.Date.Add(end);
        if (end <= start) deadline = deadline.AddDays(1);
        return now >= deadline;
    }

    public static Task Lock(ApplicationDbContext db, int serviceId, int memberId, CancellationToken ct = default)
    {
        var key = $"EPIC:SCAN:CHURCH:{serviceId}:{memberId}";
        return db.Database.ExecuteSqlInterpolatedAsync($@"DECLARE @result int;
            EXEC @result = sp_getapplock @Resource={key}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000;
            IF @result < 0 THROW 51000, 'Attendance is being updated. Please retry.', 1;", ct);
    }
}

public sealed class AutomaticAttendanceWorker(IServiceScopeFactory scopes, IConfiguration configuration,
    ILogger<AutomaticAttendanceWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // Limit automatic backfill on rollout. Set a fixed start date to catch longer outages.
        var from = DateTime.TryParseExact(configuration["AttendanceAutomation:StartDate"], "yyyy-MM-dd",
            CultureInfo.InvariantCulture, DateTimeStyles.None, out var configured) ? configured.Date : DateTime.Today.AddDays(-1);
        while (!ct.IsCancellationRequested)
        {
            try { await RecordMissing(from, ct); }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Automatic attendance failed; the next cycle will retry."); }
            try { await Task.Delay(TimeSpan.FromSeconds(30), ct); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task RecordMissing(DateTime from, CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTime.Now;
        var services = await db.ChurchServices.AsNoTracking().Where(s => s.ServiceDate >= from && s.ServiceDate < now.Date.AddDays(1))
            .OrderBy(s => s.ServiceDate).ToListAsync(ct);
        foreach (var service in services.Where(s => AutomaticAttendanceRules.HasEnded(s, now)))
        {
            var nextDay = service.ServiceDate.Date.AddDays(1);
            var memberIds = await db.Members.AsNoTracking().Where(m => m.CustomerId == service.CustomerId && m.Status == "ACTIVE" &&
                (m.DateJoined ?? m.CreatedDate) < nextDay &&
                !db.Attendances.Any(a => a.ChurchServiceId == service.ChurchServiceId && a.MemberId == m.MemberId))
                .OrderBy(m => m.MemberId).Select(m => m.MemberId).ToListAsync(ct);
            foreach (var memberId in memberIds)
            {
                await using var transaction = await db.Database.BeginTransactionAsync(ct);
                await AutomaticAttendanceRules.Lock(db, service.ChurchServiceId, memberId, ct);
                var currentService = await db.ChurchServices.AsNoTracking().SingleAsync(s => s.ChurchServiceId == service.ChurchServiceId, ct);
                if (!AutomaticAttendanceRules.HasEnded(currentService, DateTime.Now)) continue;
                if (await db.Attendances.AnyAsync(a => a.ChurchServiceId == service.ChurchServiceId && a.MemberId == memberId, ct)) continue;
                if (!await db.Members.AnyAsync(m => m.MemberId == memberId && m.CustomerId == currentService.CustomerId && m.Status == "ACTIVE", ct)) continue;
                db.Attendances.Add(new Attendance { MemberId = memberId, ChurchServiceId = service.ChurchServiceId,
                    AttendanceDate = service.ServiceDate, Service = service.ServiceName, Status = "ABSENT",
                    RecordedBy = "SYSTEM: automatic attendance", RecordedDate = DateTime.Now });
                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
                db.ChangeTracker.Clear();
            }
        }
    }
}
