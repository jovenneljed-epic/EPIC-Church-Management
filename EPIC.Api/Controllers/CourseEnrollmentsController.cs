using System.Security.Claims;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CourseEnrollmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CourseEnrollmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/CourseEnrollments/my-courses
        // Get courses enrolled by the logged-in user
        // =========================================================

        [HttpGet("my-courses")]
        public async Task<IActionResult> GetMyCourses()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "User identity could not be determined."
                });
            }

            var enrollments = await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.UserId == userId.Value)
                .Include(e => e.Course)
                .OrderByDescending(e => e.EnrolledDate)
                .Select(e => new
                {
                    e.CourseEnrollmentId,
                    e.CourseId,
                    CourseTitle = e.Course!.Title,
                    e.Course!.ThumbnailUrl,
                    e.Course!.Category,
                    e.Course!.Level,
                    e.Course!.EstimatedMinutes,
                    e.EnrolledDate,
                    e.CompletedDate,
                    e.IsCompleted,
                    e.ProgressPercentage
                })
                .ToListAsync();

            return Ok(enrollments);
        }


        // =========================================================
        // GET: api/CourseEnrollments/course/1
        // Get current user's enrollment for a course
        // =========================================================

        [HttpGet("course/{courseId:int}")]
        public async Task<IActionResult> GetCourseEnrollment(int courseId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "User identity could not be determined."
                });
            }

            var enrollment = await _context.CourseEnrollments
                .AsNoTracking()
                .Include(e => e.Course)
                .Include(e => e.LessonProgresses)
                .FirstOrDefaultAsync(e =>
                    e.CourseId == courseId &&
                    e.UserId == userId.Value);

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "You are not enrolled in this course."
                });
            }

            return Ok(new
            {
                enrollment.CourseEnrollmentId,
                enrollment.CourseId,
                CourseTitle = enrollment.Course?.Title,
                enrollment.EnrolledDate,
                enrollment.CompletedDate,
                enrollment.IsCompleted,
                enrollment.ProgressPercentage,

                LessonProgress = enrollment.LessonProgresses
                    .OrderBy(p => p.LessonId)
                    .Select(p => new
                    {
                        p.LessonProgressId,
                        p.LessonId,
                        p.IsCompleted,
                        p.ProgressPercentage,
                        p.StartedDate,
                        p.CompletedDate
                    })
            });
        }


        // =========================================================
        // POST: api/CourseEnrollments/enroll/1
        // Enroll logged-in user in a course
        // =========================================================

        [HttpPost("enroll/{courseId:int}")]
        public async Task<IActionResult> Enroll(int courseId)
        {
            return await (new AcademyController(_context) { ControllerContext = ControllerContext }).Enroll(courseId);
        }


        // =========================================================
        // POST: api/CourseEnrollments/1/start-lesson/5
        // Mark lesson as started
        // =========================================================

        [HttpPost("{courseEnrollmentId:int}/start-lesson/{lessonId:int}")]
        public async Task<IActionResult> StartLesson(
            int courseEnrollmentId,
            int lessonId)
        {
            return await (new AcademyController(_context) { ControllerContext = ControllerContext }).SaveProgress(lessonId, false, courseEnrollmentId);
        }


        // =========================================================
        // POST: api/CourseEnrollments/1/complete-lesson/5
        // Complete a lesson and update course progress
        // =========================================================

        [HttpPost("{courseEnrollmentId:int}/complete-lesson/{lessonId:int}")]
        public async Task<IActionResult> CompleteLesson(
            int courseEnrollmentId,
            int lessonId)
        {
            return await (new AcademyController(_context) { ControllerContext = ControllerContext }).SaveProgress(lessonId, true, courseEnrollmentId);
        }


        // =========================================================
        // GET: api/CourseEnrollments/1/progress
        // Detailed progress for the logged-in user
        // =========================================================

        [HttpGet("{courseEnrollmentId:int}/progress")]
        public async Task<IActionResult> GetProgress(
            int courseEnrollmentId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var enrollment = await _context.CourseEnrollments
                .AsNoTracking()
                .Include(e => e.Course)
                .Include(e => e.LessonProgresses)
                .FirstOrDefaultAsync(e =>
                    e.CourseEnrollmentId == courseEnrollmentId &&
                    e.UserId == userId.Value);

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "Course enrollment not found."
                });
            }

            var lessons = await _context.Lessons
                .AsNoTracking()
                .Where(l =>
                    l.CourseModule!.CourseId ==
                    enrollment.CourseId &&
                    l.IsPublished)
                .OrderBy(l => l.CourseModule!.SortOrder)
                .ThenBy(l => l.SortOrder)
                .Select(l => new
                {
                    l.LessonId,
                    l.CourseModuleId,
                    ModuleTitle = l.CourseModule!.Title,
                    l.Title,
                    l.SortOrder,
                    l.EstimatedMinutes,

                    Progress = enrollment.LessonProgresses
                        .Where(p => p.LessonId == l.LessonId)
                        .Select(p => new
                        {
                            p.IsCompleted,
                            p.ProgressPercentage,
                            p.StartedDate,
                            p.CompletedDate
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new
            {
                enrollment.CourseEnrollmentId,
                enrollment.CourseId,
                CourseTitle = enrollment.Course?.Title,

                enrollment.EnrolledDate,
                enrollment.CompletedDate,
                enrollment.IsCompleted,
                enrollment.ProgressPercentage,

                TotalLessons = lessons.Count,

                CompletedLessons = lessons.Count(l =>
                    l.Progress != null &&
                    l.Progress.IsCompleted),

                Lessons = lessons
            });
        }


        // =========================================================
        // PRIVATE: GET CURRENT USER ID
        // =========================================================

        private int? GetCurrentUserId()
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("sub")?.Value;

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }
    }
}