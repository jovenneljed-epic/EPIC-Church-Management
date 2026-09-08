using System.Security.Claims;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Controllers;

[ApiController, Authorize, Route("api/Academy")]
public class AcademyController(ApplicationDbContext db) : ControllerBase
{
    private async Task<User?> MemberUser()
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId"), out var id)) return null;
        return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == id && u.IsActive && u.MemberId != null && u.Member != null && u.Member.Status == "ACTIVE");
    }
    private IActionResult MembersOnly() => StatusCode(403, new { message = "Academy is available to active church members. Ask your church administrator to link your account to your member profile." });
    private Task Lock(int userId, int courseId) {
        var key = $"EPIC:ACADEMY:{userId}:{courseId}";
        return db.Database.ExecuteSqlInterpolatedAsync($@"DECLARE @result int;
            EXEC @result = sp_getapplock @Resource={key}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000;
            IF @result < 0 THROW 51000, 'Learning progress is updating. Please retry.', 1;");
    }
    private IQueryable<Lesson> PublishedLessons(int courseId) => db.Lessons.Where(l => l.IsPublished && l.CourseModule != null && l.CourseModule.IsPublished && l.CourseModule.CourseId == courseId)
        .OrderBy(l => l.CourseModule!.SortOrder).ThenBy(l => l.CourseModuleId).ThenBy(l => l.SortOrder).ThenBy(l => l.LessonId);

    [HttpGet("courses")]
    public async Task<IActionResult> Courses() {
        var user = await MemberUser(); if (user == null) return MembersOnly();
        var courses = await db.Courses.AsNoTracking().Where(c => c.IsPublished).OrderByDescending(c => c.IsFeatured).ThenBy(c => c.Title)
            .Select(c => new { c.CourseId, c.Title, c.ShortDescription, c.Category, c.Level, c.EstimatedMinutes,
                lessonCount = db.Lessons.Count(l => l.IsPublished && l.CourseModule != null && l.CourseModule.IsPublished && l.CourseModule.CourseId == c.CourseId),
                enrollment = db.CourseEnrollments.Where(e => e.CourseId == c.CourseId && e.UserId == user.UserId)
                    .Select(e => new { e.CourseEnrollmentId, e.ProgressPercentage, e.IsCompleted }).FirstOrDefault() }).ToListAsync();
        return Ok(courses);
    }

    [HttpGet("courses/{courseId:int}")]
    public async Task<IActionResult> Course(int courseId) {
        var user = await MemberUser(); if (user == null) return MembersOnly();
        var course = await db.Courses.AsNoTracking().Where(c => c.CourseId == courseId && c.IsPublished)
            .Select(c => new { c.CourseId, c.Title, c.Description, c.ShortDescription }).FirstOrDefaultAsync();
        if (course == null) return NotFound();
        var enrollment = await db.CourseEnrollments.AsNoTracking().SingleOrDefaultAsync(e => e.CourseId == courseId && e.UserId == user.UserId);
        var completed = enrollment == null ? [] : await db.LessonProgresses.Where(p => p.CourseEnrollmentId == enrollment.CourseEnrollmentId && p.IsCompleted).Select(p => p.LessonId).ToListAsync();
        var lessons = await PublishedLessons(courseId).AsNoTracking().Select(l => new { l.LessonId, l.Title, l.EstimatedMinutes, moduleTitle = l.CourseModule!.Title }).ToListAsync();
        var unlocked = enrollment != null;
        var list = lessons.Select(l => { var locked = !unlocked; var done = completed.Contains(l.LessonId); unlocked = unlocked && done;
            return new { l.LessonId, l.Title, l.EstimatedMinutes, l.moduleTitle, isCompleted = done, isLocked = locked }; }).ToList();
        var doneCount = list.Count(l => l.isCompleted);
        return Ok(new { course, isEnrolled = enrollment != null, courseEnrollmentId = enrollment?.CourseEnrollmentId,
            progressPercentage = list.Count == 0 ? 0 : (int)Math.Round(100.0 * doneCount / list.Count), lessons = list });
    }

    [HttpPost("courses/{courseId:int}/enroll")]
    public async Task<IActionResult> Enroll(int courseId) {
        var user = await MemberUser(); if (user == null) return MembersOnly();
        if (!await db.Courses.AnyAsync(c => c.CourseId == courseId && c.IsPublished)) return NotFound(new { message = "This course is not published." });
        if (!await PublishedLessons(courseId).AnyAsync()) return BadRequest(new { message = "This course has no published lessons yet. Please check back soon." });
        await using var transaction = await db.Database.BeginTransactionAsync();
        await Lock(user.UserId, courseId);
        var enrollment = await db.CourseEnrollments.SingleOrDefaultAsync(e => e.UserId == user.UserId && e.CourseId == courseId);
        if (enrollment == null) { enrollment = new CourseEnrollment { UserId = user.UserId, CourseId = courseId }; db.CourseEnrollments.Add(enrollment); await db.SaveChangesAsync(); }
        await transaction.CommitAsync();
        return Ok(new { message = "You are enrolled. Start your first lesson below.", enrollment.CourseEnrollmentId, enrollment.CourseId, enrollment.UserId, enrollment.ProgressPercentage, enrollment.IsCompleted });
    }

    [HttpGet("lessons/{lessonId:int}")]
    public async Task<IActionResult> Lesson(int lessonId) {
        var user = await MemberUser(); if (user == null) return MembersOnly();
        var lesson = await db.Lessons.AsNoTracking().Include(l => l.CourseModule).ThenInclude(m => m!.Course)
            .SingleOrDefaultAsync(l => l.LessonId == lessonId && l.IsPublished && l.CourseModule != null && l.CourseModule.IsPublished && l.CourseModule.Course != null && l.CourseModule.Course.IsPublished);
        if (lesson == null) return NotFound();
        var enrollment = await db.CourseEnrollments.AsNoTracking().SingleOrDefaultAsync(e => e.UserId == user.UserId && e.CourseId == lesson.CourseModule!.CourseId);
        if (enrollment == null) return BadRequest(new { message = "Enroll in this course first." });
        var ids = await PublishedLessons(enrollment.CourseId).Select(l => l.LessonId).ToListAsync();
        var previous = ids.TakeWhile(id => id != lessonId).ToList();
        if (await db.LessonProgresses.CountAsync(p => p.CourseEnrollmentId == enrollment.CourseEnrollmentId && previous.Contains(p.LessonId) && p.IsCompleted) != previous.Count)
            return BadRequest(new { message = "Complete the previous lessons first." });
        var progress = await db.LessonProgresses.AsNoTracking().SingleOrDefaultAsync(p => p.CourseEnrollmentId == enrollment.CourseEnrollmentId && p.LessonId == lessonId);
        return Ok(new { lesson.LessonId, lesson.Title, lesson.Content, lesson.VideoUrl, lesson.ResourceUrl, lesson.EstimatedMinutes,
            courseId = enrollment.CourseId, isCompleted = progress?.IsCompleted ?? false });
    }

    [HttpPost("lessons/{lessonId:int}/start")]
    public Task<IActionResult> Start(int lessonId) => SaveProgress(lessonId, false);
    [HttpPost("lessons/{lessonId:int}/complete")]
    public Task<IActionResult> Complete(int lessonId) => SaveProgress(lessonId, true);

    // Legacy enrollment routes pass the enrollment ID here so it cannot be substituted.
    [NonAction]
    public async Task<IActionResult> SaveProgress(int lessonId, bool complete, int? requiredEnrollmentId = null) {
        var user = await MemberUser(); if (user == null) return MembersOnly();
        var lesson = await db.Lessons.AsNoTracking().Include(l => l.CourseModule).ThenInclude(m => m!.Course)
            .SingleOrDefaultAsync(l => l.LessonId == lessonId && l.IsPublished && l.CourseModule != null && l.CourseModule.IsPublished && l.CourseModule.Course != null && l.CourseModule.Course.IsPublished);
        if (lesson == null) return NotFound();
        var courseId = lesson.CourseModule!.CourseId;
        await using var transaction = await db.Database.BeginTransactionAsync();
        await Lock(user.UserId, courseId);
        var enrollment = await db.CourseEnrollments.SingleOrDefaultAsync(e => e.UserId == user.UserId && e.CourseId == courseId);
        if (enrollment == null || (requiredEnrollmentId != null && requiredEnrollmentId != enrollment.CourseEnrollmentId)) return BadRequest(new { message = "Enroll in this course first." });
        var ids = await PublishedLessons(courseId).Select(l => l.LessonId).ToListAsync();
        var previous = ids.TakeWhile(id => id != lessonId).ToList();
        if (await db.LessonProgresses.CountAsync(p => p.CourseEnrollmentId == enrollment.CourseEnrollmentId && previous.Contains(p.LessonId) && p.IsCompleted) != previous.Count)
            return BadRequest(new { message = "Complete the previous lessons first." });
        var progress = await db.LessonProgresses.SingleOrDefaultAsync(p => p.CourseEnrollmentId == enrollment.CourseEnrollmentId && p.LessonId == lessonId);
        if (progress == null) { progress = new LessonProgress { CourseEnrollmentId = enrollment.CourseEnrollmentId, LessonId = lessonId, StartedDate = DateTime.UtcNow }; db.LessonProgresses.Add(progress); }
        progress.StartedDate ??= DateTime.UtcNow;
        if (complete && !progress.IsCompleted) { progress.IsCompleted = true; progress.ProgressPercentage = 100; progress.CompletedDate = DateTime.UtcNow; }
        await db.SaveChangesAsync();
        var done = await db.LessonProgresses.CountAsync(p => p.CourseEnrollmentId == enrollment.CourseEnrollmentId && ids.Contains(p.LessonId) && p.IsCompleted);
        enrollment.ProgressPercentage = ids.Count == 0 ? 0 : (int)Math.Round(100.0 * done / ids.Count);
        enrollment.IsCompleted = ids.Count > 0 && done == ids.Count;
        enrollment.CompletedDate = enrollment.IsCompleted ? enrollment.CompletedDate ?? DateTime.UtcNow : null;
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        var nextLesson = await PublishedLessons(courseId).AsNoTracking()
            .Where(l => !db.LessonProgresses.Any(p => p.CourseEnrollmentId == enrollment.CourseEnrollmentId && p.LessonId == l.LessonId && p.IsCompleted))
            .Select(l => new { l.LessonId, l.Title }).FirstOrDefaultAsync();
        return Ok(new { message = complete ? "Lesson completed." : "Lesson started.", lessonProgress = new { progress.LessonProgressId, progress.CourseEnrollmentId, progress.LessonId, progress.ProgressPercentage, progress.IsCompleted, progress.StartedDate, progress.CompletedDate },
            courseProgress = new { enrollment.CourseEnrollmentId, enrollment.CourseId, enrollment.ProgressPercentage, enrollment.IsCompleted, enrollment.CompletedDate }, nextLesson });
    }

    [HttpGet("rewards")]
    public async Task<IActionResult> Rewards(int skip = 0) {
        var user = await MemberUser(); if (user == null) return MembersOnly();
        var memberId = user.MemberId!.Value;
        await new MemberRewardService(db).Refresh(memberId, HttpContext.RequestAborted);
        var total = await db.MemberRewards.Where(r => r.MemberId == memberId).SumAsync(r => r.Points);
        var tier = MemberRewardRules.Tier(total);
        return Ok(new { totalPoints = total, tier = tier.Name, tierFloor = tier.Floor, nextTierPoints = tier.Next,
            rules = MemberRewardRules.Guide,
            badges = await db.MemberRewards.AsNoTracking().Where(r => r.MemberId == memberId && r.Points > 0 && r.SourceKey.StartsWith("MILESTONE:"))
                .Select(r => new { r.SourceKey, r.Title, r.Points }).ToListAsync(),
            history = await db.MemberRewardHistory.AsNoTracking().Where(r => r.MemberId == memberId).OrderByDescending(r => r.Id).Skip(Math.Max(0, skip)).Take(30)
                .Select(r => new { r.Id, r.Title, r.PointsChange, r.CreatedAt }).ToListAsync() });
    }
}
