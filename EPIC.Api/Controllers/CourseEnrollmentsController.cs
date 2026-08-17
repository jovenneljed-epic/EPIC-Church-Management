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
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "User identity could not be determined."
                });
            }

            var course = await _context.Courses
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null)
            {
                return NotFound(new
                {
                    message = "Course not found."
                });
            }

            if (!course.IsPublished)
            {
                return BadRequest(new
                {
                    message = "This course is not currently published."
                });
            }

            var existingEnrollment = await _context.CourseEnrollments
                .FirstOrDefaultAsync(e =>
                    e.CourseId == courseId &&
                    e.UserId == userId.Value);

            if (existingEnrollment != null)
            {
                return Ok(new
                {
                    message = "You are already enrolled in this course.",
                    courseEnrollmentId =
                        existingEnrollment.CourseEnrollmentId,
                    isCompleted =
                        existingEnrollment.IsCompleted,
                    progressPercentage =
                        existingEnrollment.ProgressPercentage
                });
            }

            var enrollment = new CourseEnrollment
            {
                CourseId = courseId,
                UserId = userId.Value,
                EnrolledDate = DateTime.UtcNow,
                IsCompleted = false,
                ProgressPercentage = 0
            };

            _context.CourseEnrollments.Add(enrollment);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetCourseEnrollment),
                new
                {
                    courseId = courseId
                },
                new
                {
                    message = "Successfully enrolled in the course.",
                    courseEnrollmentId =
                        enrollment.CourseEnrollmentId,
                    courseId = enrollment.CourseId,
                    progressPercentage =
                        enrollment.ProgressPercentage
                });
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
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var enrollment = await _context.CourseEnrollments
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

            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.LessonId == lessonId);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            var lessonBelongsToCourse = await _context.CourseModules
                .AnyAsync(m =>
                    m.CourseModuleId == lesson.CourseModuleId &&
                    m.CourseId == enrollment.CourseId);

            if (!lessonBelongsToCourse)
            {
                return BadRequest(new
                {
                    message =
                        "This lesson does not belong to the enrolled course."
                });
            }

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p =>
                    p.CourseEnrollmentId == courseEnrollmentId &&
                    p.LessonId == lessonId);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    CourseEnrollmentId = courseEnrollmentId,
                    LessonId = lessonId,
                    IsCompleted = false,
                    ProgressPercentage = 0,
                    StartedDate = DateTime.UtcNow
                };

                _context.LessonProgresses.Add(progress);
            }
            else if (!progress.StartedDate.HasValue)
            {
                progress.StartedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lesson started.",
                lessonId,
                progress.LessonProgressId,
                progress.StartedDate,
                progress.IsCompleted,
                progress.ProgressPercentage
            });
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
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized();
            }

            var enrollment = await _context.CourseEnrollments
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

            var lesson = await _context.Lessons
                .Include(l => l.CourseModule)
                .FirstOrDefaultAsync(l => l.LessonId == lessonId);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            if (lesson.CourseModule == null ||
                lesson.CourseModule.CourseId != enrollment.CourseId)
            {
                return BadRequest(new
                {
                    message =
                        "This lesson does not belong to the enrolled course."
                });
            }

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p =>
                    p.CourseEnrollmentId == courseEnrollmentId &&
                    p.LessonId == lessonId);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    CourseEnrollmentId = courseEnrollmentId,
                    LessonId = lessonId,
                    StartedDate = DateTime.UtcNow
                };

                _context.LessonProgresses.Add(progress);
            }

            progress.IsCompleted = true;
            progress.ProgressPercentage = 100;
            progress.StartedDate ??= DateTime.UtcNow;
            progress.CompletedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // =====================================================
            // CALCULATE COURSE PROGRESS
            // =====================================================

            var totalLessons = await _context.Lessons
                .Where(l =>
                    l.CourseModule!.CourseId ==
                    enrollment.CourseId &&
                    l.IsPublished)
                .CountAsync();

            var completedLessons = await _context.LessonProgresses
                .Where(p =>
                    p.CourseEnrollmentId ==
                    enrollment.CourseEnrollmentId &&
                    p.IsCompleted)
                .CountAsync();

            var progressPercentage = totalLessons > 0
                ? (int)Math.Round(
                    completedLessons * 100.0 / totalLessons)
                : 0;

            enrollment.ProgressPercentage =
                Math.Clamp(progressPercentage, 0, 100);

            // =====================================================
            // COURSE COMPLETION
            // =====================================================

            if (totalLessons > 0 &&
                completedLessons >= totalLessons)
            {
                enrollment.IsCompleted = true;
                enrollment.CompletedDate ??= DateTime.UtcNow;
            }
            else
            {
                enrollment.IsCompleted = false;
                enrollment.CompletedDate = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lesson completed successfully.",

                lessonId,

                lessonCompleted = true,

                courseEnrollmentId =
                    enrollment.CourseEnrollmentId,

                completedLessons,

                totalLessons,

                progressPercentage =
                    enrollment.ProgressPercentage,

                courseCompleted =
                    enrollment.IsCompleted,

                completedDate =
                    enrollment.CompletedDate
            });
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