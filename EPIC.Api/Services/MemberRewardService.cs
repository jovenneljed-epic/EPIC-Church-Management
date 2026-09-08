using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Services;

public record RewardTarget(string Key, string Title, int Points);

public static class MemberRewardRules
{
    public static int AttendancePoints(string status) => status.ToUpperInvariant() switch { "EARLY" => 15, "PRESENT" => 10, "LATE" => 5, _ => 0 };
    public static readonly object[] Guide = [
        new { title = "Complete a lesson", points = 10, detail = "Once per distinct lesson" },
        new { title = "First lesson", points = 25, detail = "One-time bonus" },
        new { title = "Complete a course", points = 100, detail = "All published lessons completed; once per course" },
        new { title = "Church attendance", points = 10, detail = "Present: 10; Early: 15 including bonus; Late: 5" },
        new { title = "Event participation", points = 10, detail = "Once per attended event" },
        new { title = "10 lessons milestone", points = 50, detail = "One-time bonus" },
        new { title = "5 services milestone", points = 50, detail = "Five distinct attended church services" },
        new { title = "20 services milestone", points = 200, detail = "Twenty distinct attended church services" }
    ];
    public static (string Name, int Floor, int? Next) Tier(int points) => points >= 1000 ? ("Platinum", 1000, null) : points >= 500 ? ("Gold", 500, 1000) : points >= 200 ? ("Silver", 200, 500) : ("Bronze", 0, 200);
}

public sealed class MemberRewardService(ApplicationDbContext db)
{
    public async Task Refresh(int memberId, CancellationToken ct = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var key = $"EPIC:REWARDS:{memberId}";
        await db.Database.ExecuteSqlInterpolatedAsync($@"DECLARE @result int;
            EXEC @result = sp_getapplock @Resource={key}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000;
            IF @result < 0 THROW 51000, 'Points are updating. Please retry.', 1;", ct);
        var desired = new Dictionary<string, RewardTarget>();
        void Add(string source, string title, int points) { if (points > 0) desired[source] = new(source, title.Length > 200 ? title[..200] : title, points); }
        var users = db.Users.Where(u => u.MemberId == memberId).Select(u => u.UserId);
        var completed = await db.LessonProgresses.AsNoTracking().Where(p => p.IsCompleted && p.CourseEnrollment != null && users.Contains(p.CourseEnrollment.UserId))
            .Select(p => new { p.LessonId, p.CourseEnrollment!.CourseId, title = p.Lesson != null ? p.Lesson.Title : "Lesson completed" }).Distinct().ToListAsync(ct);
        foreach (var lesson in completed.DistinctBy(l => l.LessonId)) Add($"LESSON:{lesson.LessonId}", lesson.title, 10);
        if (completed.Count > 0) Add("MILESTONE:FIRST_LESSON", "First lesson completed", 25);
        if (completed.Select(l => l.LessonId).Distinct().Count() >= 10) Add("MILESTONE:10_LESSONS", "10 lessons completed", 50);
        var courseIds = completed.Select(l => l.CourseId).Distinct().ToList();
        var lessons = await db.Lessons.AsNoTracking().Where(l => l.IsPublished && l.CourseModule != null && l.CourseModule.IsPublished && courseIds.Contains(l.CourseModule.CourseId))
            .Select(l => new { l.LessonId, l.CourseModule!.CourseId, title = l.CourseModule.Course != null ? l.CourseModule.Course.Title : "Course completed" }).ToListAsync(ct);
        foreach (var course in lessons.GroupBy(l => l.CourseId))
            if (course.All(l => completed.Any(p => p.CourseId == l.CourseId && p.LessonId == l.LessonId))) Add($"COURSE:{course.Key}", "Course: " + course.First().title, 100);
        var attendance = await db.Attendances.AsNoTracking().Where(a => a.MemberId == memberId && a.ChurchServiceId != null && a.ChurchService != null && a.ChurchService.Status != "CANCELLED")
            .Select(a => new { a.ChurchServiceId, a.Status }).ToListAsync(ct);
        foreach (var record in attendance) Add($"CHURCH:{record.ChurchServiceId}", "Church attendance: " + record.Status.ToLowerInvariant(), MemberRewardRules.AttendancePoints(record.Status));
        var count = attendance.Where(a => MemberRewardRules.AttendancePoints(a.Status) > 0).Select(a => a.ChurchServiceId).Distinct().Count();
        if (count >= 5) Add("MILESTONE:5_SERVICES", "5 church services attended", 50);
        if (count >= 20) Add("MILESTONE:20_SERVICES", "20 church services attended", 200);
        var events = await db.EventAttendances.AsNoTracking().Where(a => a.MemberId == memberId && a.Event != null && a.Event.Status != "CANCELLED")
            .Select(a => new { a.EventId, a.Status }).ToListAsync(ct);
        foreach (var record in events) if (MemberRewardRules.AttendancePoints(record.Status) > 0) Add($"EVENT:{record.EventId}", "Event participation", 10);

        var existing = await db.MemberRewards.Where(r => r.MemberId == memberId).ToDictionaryAsync(r => r.SourceKey, ct);
        foreach (var source in desired.Keys.Union(existing.Keys))
        {
            desired.TryGetValue(source, out var target);
            existing.TryGetValue(source, out var reward);
            var delta = (target?.Points ?? 0) - (reward?.Points ?? 0);
            if (delta == 0) continue;
            if (reward == null) { reward = new MemberReward { MemberId = memberId, SourceKey = source }; db.MemberRewards.Add(reward); }
            reward.Points = target?.Points ?? 0;
            reward.Title = target?.Title ?? reward.Title;
            reward.UpdatedAt = DateTime.UtcNow;
            var historyTitle = delta < 0 ? "Correction: " + reward.Title : reward.Title;
            db.MemberRewardHistory.Add(new MemberRewardHistory { MemberId = memberId, SourceKey = source,
                Title = historyTitle.Length > 200 ? historyTitle[..200] : historyTitle, PointsChange = delta });
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }
}
