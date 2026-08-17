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
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
            }

            if (request == null || request.CourseId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid CourseId is required."
                });
            }

            var course = await _context.Courses
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.CourseId == request.CourseId);

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

            var existing = await _context.CourseEnrollments
                .FirstOrDefaultAsync(e =>
                    e.CourseId == request.CourseId &&
                    e.UserId == userId.Value);

            if (existing != null)
            {
                return Ok(new
                {
                    message = "You are already enrolled in this course.",
                    courseEnrollmentId = existing.CourseEnrollmentId,
                    courseId = existing.CourseId,
                    userId = existing.UserId,
                    enrolledDate = existing.EnrolledDate,
                    completedDate = existing.CompletedDate,
                    isCompleted = existing.IsCompleted,
                    progressPercentage = existing.ProgressPercentage
                });
            }

            var enrollment = new CourseEnrollment
            {
                CourseId = request.CourseId,
                UserId = userId.Value,
                EnrolledDate = DateTime.UtcNow,
                IsCompleted = false,
                ProgressPercentage = 0,
                CompletedDate = null
            };

            _context.CourseEnrollments.Add(enrollment);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetEnrollment),
                new
                {
                    id = enrollment.CourseEnrollmentId
                },
                new
                {
                    enrollment.CourseEnrollmentId,
                    enrollment.CourseId,
                    enrollment.UserId,
                    enrollment.EnrolledDate,
                    enrollment.CompletedDate,
                    enrollment.IsCompleted,
                    enrollment.ProgressPercentage
                });
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
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
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

            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l =>
                    l.LessonId == lessonId);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            var module = await _context.CourseModules
                .FirstOrDefaultAsync(m =>
                    m.CourseModuleId == lesson.CourseModuleId);

            if (module == null)
            {
                return BadRequest(new
                {
                    message = "Lesson module not found."
                });
            }

            if (module.CourseId != enrollment.CourseId)
            {
                return BadRequest(new
                {
                    message = "Lesson does not belong to this course."
                });
            }

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p =>
                    p.CourseEnrollmentId == id &&
                    p.LessonId == lessonId);

            var now = DateTime.UtcNow;

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    CourseEnrollmentId = id,
                    LessonId = lessonId,
                    ProgressPercentage = 0,
                    IsCompleted = false,
                    StartedDate = now,
                    CompletedDate = null
                };

                _context.LessonProgresses.Add(progress);
            }
            else if (progress.StartedDate == null)
            {
                progress.StartedDate = now;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lesson started.",
                lessonProgressId = progress.LessonProgressId,
                courseEnrollmentId = progress.CourseEnrollmentId,
                lessonId = progress.LessonId,
                progressPercentage = progress.ProgressPercentage,
                isCompleted = progress.IsCompleted,
                startedDate = progress.StartedDate,
                completedDate = progress.CompletedDate
            });
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
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to determine the authenticated user."
                });
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

            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l =>
                    l.LessonId == lessonId);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            var module = await _context.CourseModules
                .FirstOrDefaultAsync(m =>
                    m.CourseModuleId == lesson.CourseModuleId);

            if (module == null)
            {
                return BadRequest(new
                {
                    message = "Lesson module not found."
                });
            }

            if (module.CourseId != enrollment.CourseId)
            {
                return BadRequest(new
                {
                    message = "Lesson does not belong to this course."
                });
            }

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p =>
                    p.CourseEnrollmentId == id &&
                    p.LessonId == lessonId);

            var now = DateTime.UtcNow;

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    CourseEnrollmentId = id,
                    LessonId = lessonId,
                    ProgressPercentage = 100,
                    IsCompleted = true,
                    StartedDate = now,
                    CompletedDate = now
                };

                _context.LessonProgresses.Add(progress);
            }
            else
            {
                if (progress.StartedDate == null)
                {
                    progress.StartedDate = now;
                }

                progress.ProgressPercentage = 100;
                progress.IsCompleted = true;
                progress.CompletedDate = now;
            }

            await _context.SaveChangesAsync();

            // =====================================================
            // CALCULATE COURSE PROGRESS
            // =====================================================

            var totalLessons = await _context.Lessons
                .Where(l =>
                    l.CourseModule != null &&
                    l.CourseModule.CourseId == enrollment.CourseId &&
                    l.IsPublished)
                .CountAsync();

            var completedLessons = await _context.LessonProgresses
                .Where(p =>
                    p.CourseEnrollmentId == id &&
                    p.IsCompleted)
                .CountAsync();

            int courseProgress = 0;

            if (totalLessons > 0)
            {
                courseProgress = (int)Math.Round(
                    (double)completedLessons * 100.0 /
                    totalLessons
                );
            }

            enrollment.ProgressPercentage = courseProgress;

            enrollment.IsCompleted =
                totalLessons > 0 &&
                completedLessons >= totalLessons;

            enrollment.CompletedDate =
                enrollment.IsCompleted
                    ? now
                    : null;

            if (enrollment.IsCompleted)
            {
                enrollment.ProgressPercentage = 100;
            }

            await _context.SaveChangesAsync();

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message = "Lesson completed successfully.",

                lessonProgress = new
                {
                    lessonProgressId =
                        progress.LessonProgressId,

                    courseEnrollmentId =
                        progress.CourseEnrollmentId,

                    lessonId =
                        progress.LessonId,

                    progressPercentage =
                        progress.ProgressPercentage,

                    isCompleted =
                        progress.IsCompleted,

                    startedDate =
                        progress.StartedDate,

                    completedDate =
                        progress.CompletedDate
                },

                courseProgress = new
                {
                    courseEnrollmentId =
                        enrollment.CourseEnrollmentId,

                    courseId =
                        enrollment.CourseId,

                    progressPercentage =
                        enrollment.ProgressPercentage,

                    isCompleted =
                        enrollment.IsCompleted,

                    completedDate =
                        enrollment.CompletedDate
                }
            });
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