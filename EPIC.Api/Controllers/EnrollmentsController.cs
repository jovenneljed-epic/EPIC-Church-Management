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
    public class EnrollmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EnrollmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/Enrollments/my
        // =========================================================

        [HttpGet("my")]
        public async Task<IActionResult> GetMyEnrollments()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
            }

            var enrollments = await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.UserId == userId.Value)
                .OrderByDescending(e => e.EnrolledDate)
                .Select(e => new
                {
                    e.CourseEnrollmentId,
                    e.CourseId,
                    e.UserId,
                    e.EnrolledDate,
                    e.CompletedDate,
                    e.IsCompleted,
                    e.ProgressPercentage,

                    Course = e.Course == null
                        ? null
                        : new
                        {
                            e.Course.CourseId,
                            e.Course.Title,
                            e.Course.ShortDescription,
                            e.Course.Description,
                            e.Course.ThumbnailUrl,
                            e.Course.Category,
                            e.Course.Level,
                            e.Course.EstimatedMinutes,
                            e.Course.IsPublished,
                            e.Course.IsFeatured
                        }
                })
                .ToListAsync();

            return Ok(enrollments);
        }

        // =========================================================
        // GET: api/Enrollments/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetEnrollment(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
            }

            var enrollment = await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e =>
                    e.CourseEnrollmentId == id &&
                    e.UserId == userId.Value)
                .Select(e => new
                {
                    e.CourseEnrollmentId,
                    e.CourseId,
                    e.UserId,
                    e.EnrolledDate,
                    e.CompletedDate,
                    e.IsCompleted,
                    e.ProgressPercentage,

                    Course = e.Course == null
                        ? null
                        : new
                        {
                            e.Course.CourseId,
                            e.Course.Title,
                            e.Course.ShortDescription,
                            e.Course.Description,
                            e.Course.ThumbnailUrl,
                            e.Course.Category,
                            e.Course.Level,
                            e.Course.EstimatedMinutes,
                            e.Course.IsPublished,
                            e.Course.IsFeatured
                        },

                    LessonProgresses = e.LessonProgresses
                        .OrderBy(p =>
                            p.Lesson != null
                                ? p.Lesson.SortOrder
                                : 0)
                        .Select(p => new
                        {
                            p.LessonProgressId,
                            p.CourseEnrollmentId,
                            p.LessonId,
                            p.ProgressPercentage,
                            p.IsCompleted,
                            p.StartedDate,
                            p.CompletedDate
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "Enrollment not found."
                });
            }

            return Ok(enrollment);
        }

        // =========================================================
        // POST: api/Enrollments
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> Enroll(
            [FromBody] EnrollRequest request)
        {
            if (request == null || request.CourseId <= 0) return BadRequest(new { message = "A valid course is required." });
            return await (new AcademyController(_context) { ControllerContext = ControllerContext }).Enroll(request.CourseId);
        }

        // =========================================================
        // DELETE: api/Enrollments/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Unenroll(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var enrollment = await _context.CourseEnrollments
                .FirstOrDefaultAsync(e =>
                    e.CourseEnrollmentId == id &&
                    e.UserId == userId.Value);

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "Enrollment not found."
                });
            }

            _context.CourseEnrollments.Remove(enrollment);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Enrollment removed successfully."
            });
        }

        // =========================================================
        // GET: api/Enrollments/course/{courseId}
        // =========================================================

        [HttpGet("course/{courseId:int}")]
        public async Task<IActionResult> GetMyCourseEnrollment(
            int courseId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
            }

            var enrollment = await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e =>
                    e.CourseId == courseId &&
                    e.UserId == userId.Value)
                .Select(e => new
                {
                    e.CourseEnrollmentId,
                    e.CourseId,
                    e.UserId,
                    e.EnrolledDate,
                    e.CompletedDate,
                    e.IsCompleted,
                    e.ProgressPercentage,

                    Course = e.Course == null
                        ? null
                        : new
                        {
                            e.Course.CourseId,
                            e.Course.Title,
                            e.Course.ShortDescription,
                            e.Course.Description,
                            e.Course.ThumbnailUrl,
                            e.Course.Category,
                            e.Course.Level,
                            e.Course.EstimatedMinutes,
                            e.Course.IsPublished,
                            e.Course.IsFeatured
                        },

                    LessonProgresses = e.LessonProgresses
                        .OrderBy(p =>
                            p.Lesson != null
                                ? p.Lesson.SortOrder
                                : 0)
                        .Select(p => new
                        {
                            p.LessonProgressId,
                            p.CourseEnrollmentId,
                            p.LessonId,
                            p.ProgressPercentage,
                            p.IsCompleted,
                            p.StartedDate,
                            p.CompletedDate
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "You are not enrolled in this course."
                });
            }

            return Ok(enrollment);
        }

        // =========================================================
        // GET: api/Enrollments/{id}/progress
        // =========================================================

        [HttpGet("{id:int}/progress")]
        public async Task<IActionResult> GetProgress(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var enrollment = await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e =>
                    e.CourseEnrollmentId == id &&
                    e.UserId == userId.Value)
                .Select(e => new
                {
                    e.CourseEnrollmentId,
                    e.CourseId,
                    e.UserId,
                    e.IsCompleted,
                    e.ProgressPercentage,
                    e.EnrolledDate,
                    e.CompletedDate,

                    LessonProgress = e.LessonProgresses
                        .OrderBy(p =>
                            p.Lesson != null
                                ? p.Lesson.SortOrder
                                : 0)
                        .Select(p => new
                        {
                            p.LessonProgressId,
                            p.LessonId,
                            p.IsCompleted,
                            p.ProgressPercentage,
                            p.StartedDate,
                            p.CompletedDate
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (enrollment == null)
            {
                return NotFound(new
                {
                    message = "Enrollment not found."
                });
            }

            return Ok(enrollment);
        }

        // =========================================================
        // POST:
        // api/Enrollments/{id}/start-lesson/{lessonId}
        // =========================================================

        [HttpPost("{id:int}/start-lesson/{lessonId:int}")]
        public async Task<IActionResult> StartLesson(
            int id,
            int lessonId)
        {
            return await (new AcademyController(_context) { ControllerContext = ControllerContext }).SaveProgress(lessonId, false, id);
        }

        // =========================================================
        // POST:
        // api/Enrollments/{id}/complete-lesson/{lessonId}
        // =========================================================

        [HttpPost("{id:int}/complete-lesson/{lessonId:int}")]
        public async Task<IActionResult> CompleteLesson(
            int id,
            int lessonId)
        {
            return await (new AcademyController(_context) { ControllerContext = ControllerContext }).SaveProgress(lessonId, true, id);
        }

        // =========================================================
        // HELPER
        // =========================================================

        private int? GetCurrentUserId()
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("UserId")?.Value;

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }
    }

    // =============================================================
    // REQUEST MODEL
    // =============================================================

    public class EnrollRequest
    {
        public int CourseId { get; set; }
    }
}