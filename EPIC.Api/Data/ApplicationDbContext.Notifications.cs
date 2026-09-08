using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Data;

public partial class ApplicationDbContext
{
    public DbSet<MemberNotification> MemberNotifications => Set<MemberNotification>();
    public DbSet<PushDevice> PushDevices => Set<PushDevice>();
    public DbSet<PushDelivery> PushDeliveries => Set<PushDelivery>();

    // Queue inbox records in the same SaveChanges transaction as attendance, including manual corrections.
    private void QueueAttendanceNotifications()
    {
        ChangeTracker.DetectChanges();
        foreach (var entry in ChangeTracker.Entries<Attendance>().ToList())
        {
            if (entry.State != EntityState.Added && !(entry.State == EntityState.Modified &&
                entry.Property(a => a.Status).OriginalValue != entry.Entity.Status)) continue;
            var row = entry.Entity;
            AddNotice(row.MemberId, "CHURCH_SERVICE", row.ChurchServiceId ?? row.EventId,
                "Attendance updated", $"{(string.IsNullOrWhiteSpace(row.Service) ? "Church attendance" : row.Service)}: {row.Status}.");
        }
        foreach (var entry in ChangeTracker.Entries<EventAttendance>().ToList())
        {
            if (entry.State != EntityState.Added && !(entry.State == EntityState.Modified &&
                entry.Property(a => a.Status).OriginalValue != entry.Entity.Status)) continue;
            var row = entry.Entity;
            var name = row.Event?.Title ?? Events.Local.FirstOrDefault(e => e.EventId == row.EventId)?.Title ?? $"Event #{row.EventId}";
            AddNotice(row.MemberId, "EVENT", row.EventId, "Event attendance updated", $"{name}: {row.Status}.");
        }
    }

    private void AddNotice(int memberId, string kind, int? reference, string title, string body)
    {
        // A failed SaveChanges may be retried on the same context without duplicating its pending notice.
        if (ChangeTracker.Entries<MemberNotification>().Any(e => e.State == EntityState.Added &&
            e.Entity.MemberId == memberId && e.Entity.Kind == kind && e.Entity.ReferenceId == reference && e.Entity.Body == body)) return;
        MemberNotifications.Add(new() { MemberId = memberId, Kind = kind, ReferenceId = reference, Title = title, Body = body });
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        QueueAttendanceNotifications();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        QueueAttendanceNotifications();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }
}
