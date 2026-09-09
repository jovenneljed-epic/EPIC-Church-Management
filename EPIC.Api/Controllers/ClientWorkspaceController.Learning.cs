using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EPIC.Api.Models;
namespace EPIC.Api.Controllers;
public partial class ClientWorkspaceController
{
    private IQueryable<Lesson> Lessons(int courseId) => db.Lessons.Where(l => l.IsPublished && l.CourseModule != null && l.CourseModule.IsPublished && l.CourseModule.CourseId == courseId)
        .OrderBy(l => l.CourseModule!.SortOrder).ThenBy(l => l.CourseModuleId).ThenBy(l => l.SortOrder).ThenBy(l => l.LessonId);
    [HttpGet("learning")]
    public async Task<IActionResult> Courses()
    {
        var a = await Account("Learning"); if (a == null) return Denied();
        return Ok(await db.Courses.AsNoTracking().Where(c => c.IsPublished).OrderBy(c => c.Title).Select(c => new {
            c.CourseId, c.Title, c.ShortDescription,
            enrolled = db.ClientCourseEnrollments.Any(e => e.ClientMemberId == a.ClientMemberId && e.CourseId == c.CourseId)
        }).ToListAsync());
    }
    [HttpGet("learning/{courseId:int}")]
    public async Task<IActionResult> CourseDetail(int courseId)
    {
        var a = await Account("Learning"); if (a == null) return Denied();
        var course = await db.Courses.AsNoTracking().Where(c => c.IsPublished && c.CourseId == courseId).Select(c => new { c.CourseId, c.Title, c.Description }).FirstOrDefaultAsync();
        if (course == null) return NotFound();
        var enrollment = await db.ClientCourseEnrollments.AsNoTracking().FirstOrDefaultAsync(e => e.CourseId == courseId && e.ClientMemberId == a.ClientMemberId);
        var done = enrollment == null ? new List<int>() : await db.ClientLessonCompletions.Where(c => c.ClientCourseEnrollmentId == enrollment.Id).Select(c => c.LessonId).ToListAsync();
        var lessons = await Lessons(courseId).AsNoTracking().Select(l => new { l.LessonId, l.Title, l.EstimatedMinutes }).ToListAsync();
        bool unlocked = enrollment != null;
        var rows = lessons.Select(l => { var completed = done.Contains(l.LessonId); var locked = !unlocked; if (!completed) unlocked = false; return new { l.LessonId, l.Title, l.EstimatedMinutes, completed, locked }; }).ToList();
        return Ok(new { course, enrolled = enrollment != null, lessons = rows, progress = lessons.Count == 0 ? 0 : rows.Count(l => l.completed) * 100 / lessons.Count });
    }
    private Task LearningLock(int member, int course) => db.Database.ExecuteSqlInterpolatedAsync($@"DECLARE @r int; EXEC @r=sp_getapplock @Resource={$"CLIENT-LEARNING:{member}:{course}"}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; IF @r<0 THROW 51000, 'Learning is updating. Please retry.', 1;");
    [HttpPost("learning/{courseId:int}/enroll")]
    public async Task<IActionResult> Enroll(int courseId)
    {
        var a = await Account("Learning"); if (a == null) return Denied();
        if (!await db.Courses.AnyAsync(c => c.CourseId == courseId && c.IsPublished)) return NotFound();
        await using var tx = await db.Database.BeginTransactionAsync(); await LearningLock(a.ClientMemberId, courseId);
        if (!await db.ClientCourseEnrollments.AnyAsync(e => e.ClientMemberId == a.ClientMemberId && e.CourseId == courseId)) {
            db.ClientCourseEnrollments.Add(new ClientCourseEnrollment { ClientMemberId = a.ClientMemberId, CourseId = courseId }); await db.SaveChangesAsync();
        }
        await tx.CommitAsync(); return Ok(new { message = "Enrollment ready." });
    }
    private async Task<(Lesson? lesson, ClientCourseEnrollment? enrollment)> AvailableLesson(int id, int member)
    {
        var lesson = await db.Lessons.Include(l => l.CourseModule).ThenInclude(m => m!.Course).FirstOrDefaultAsync(l => l.LessonId == id && l.IsPublished && l.CourseModule != null && l.CourseModule.IsPublished && l.CourseModule.Course != null && l.CourseModule.Course.IsPublished);
        if (lesson == null) return (null, null);
        var e = await db.ClientCourseEnrollments.FirstOrDefaultAsync(e => e.ClientMemberId == member && e.CourseId == lesson.CourseModule!.CourseId);
        if (e == null) return (null, null);
        var order = await Lessons(e.CourseId).Select(l => l.LessonId).ToListAsync();
        var previous = order.TakeWhile(i => i != id).ToList();
        if (await db.ClientLessonCompletions.CountAsync(c => c.ClientCourseEnrollmentId == e.Id && previous.Contains(c.LessonId)) != previous.Count) return (null, null);
        return (lesson, e);
    }
    [HttpGet("learning/lessons/{id:int}")]
    public async Task<IActionResult> ReadLesson(int id)
    {
        var a = await Account("Learning"); if (a == null) return Denied();
        var (l, e) = await AvailableLesson(id, a.ClientMemberId); if (l == null) return StatusCode(403, new { message = "Enroll and finish the earlier lessons first." });
        return Ok(new { l.LessonId, l.Title, l.Content, l.VideoUrl, l.ResourceUrl, courseId = e!.CourseId });
    }
    [HttpPost("learning/lessons/{id:int}/complete")]
    public async Task<IActionResult> CompleteLesson(int id)
    {
        var a = await Account("Learning"); if (a == null) return Denied();
        var (l, e) = await AvailableLesson(id, a.ClientMemberId); if (l == null || e == null) return StatusCode(403, new { message = "Enroll and finish the earlier lessons first." });
        await using var tx = await db.Database.BeginTransactionAsync(); await LearningLock(a.ClientMemberId, e.CourseId);
        if (!await db.ClientLessonCompletions.AnyAsync(c => c.ClientCourseEnrollmentId == e.Id && c.LessonId == id)) {
            db.ClientLessonCompletions.Add(new ClientLessonCompletion { ClientCourseEnrollmentId = e.Id, LessonId = id }); await db.SaveChangesAsync();
        }
        await tx.CommitAsync(); return Ok(new { message = "Lesson completed." });
    }
}
