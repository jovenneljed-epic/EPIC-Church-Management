using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ResendEmailService? _emailService;

        public CoursesController(
            ApplicationDbContext context,
            ResendEmailService? emailService = null)
        {
            _context = context;
            _emailService = emailService;
        }

        // =========================================================
        // GET: api/Courses
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetCourses(
            [FromQuery] bool? published = null,
            [FromQuery] string? category = null,
            [FromQuery] string? level = null)
        {
            var query = _context.Courses
                .AsNoTracking()
                .Include(c => c.Modules)
                    .ThenInclude(m => m.Lessons)
                .AsQueryable();

            if (published.HasValue)
            {
                query = query.Where(c => c.IsPublished == published.Value);
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(c => c.Category == category);
            }

            if (!string.IsNullOrWhiteSpace(level))
            {
                query = query.Where(c => c.Level == level);
            }

            var courses = await query
                .OrderByDescending(c => c.IsFeatured)
                .ThenByDescending(c => c.CreatedDate)
                .Select(c => new
                {
                    c.CourseId,
                    c.Title,
                    c.ShortDescription,
                    c.Description,
                    c.ThumbnailUrl,
                    c.Category,
                    c.Level,
                    c.EstimatedMinutes,
                    c.IsPublished,
                    c.IsFeatured,
                    c.CreatedDate,
                    c.UpdatedDate,

                    ModuleCount = c.Modules.Count(),

                    LessonCount = c.Modules
                        .SelectMany(m => m.Lessons)
                        .Count()
                })
                .ToListAsync();

            return Ok(courses);
        }


        // =========================================================
        // GET: api/Courses/5
        // =========================================================

        [HttpGet("{id:int}")]
public async Task<IActionResult> GetCourse(int id)
{
    var course = await _context.Courses
        .AsNoTracking()
        .Where(c => c.CourseId == id)
        .Select(c => new
        {
            c.CourseId,
            c.Title,
            c.ShortDescription,
            c.Description,
            c.ThumbnailUrl,
            c.Category,
            c.Level,
            c.EstimatedMinutes,
            c.IsPublished,
            c.IsFeatured,
            c.CreatedDate,
            c.UpdatedDate,

            Modules = c.Modules
                .OrderBy(m => m.SortOrder)
                .Select(m => new
                {
                    m.CourseModuleId,
                    m.Title,
                    m.Description,
                    m.SortOrder,

                    Lessons = m.Lessons
                        .OrderBy(l => l.SortOrder)
                        .Select(l => new
                        {
                            l.LessonId,
                            l.CourseModuleId,
                            l.Title,
                            l.Content,
                            l.VideoUrl,
                            l.ResourceUrl,
                            l.SortOrder,
                            l.EstimatedMinutes,
                            l.IsPublished,
                            l.IsFreePreview
                        })
                        .ToList()
                })
                .ToList()
        })
        .FirstOrDefaultAsync();

    if (course == null)
    {
        return NotFound(new
        {
            message = "Course not found."
        });
    }

    return Ok(course);
}

        // =========================================================
        // POST: api/Courses
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateCourse(
            [FromBody] Course course)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            course.CourseId = 0;
            course.CreatedDate = DateTime.UtcNow;
            course.UpdatedDate = null;

            _context.Courses.Add(course);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetCourse),
                new { id = course.CourseId },
                course);
        }


        // =========================================================
        // PUT: api/Courses/5
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateCourse(
            int id,
            [FromBody] Course updatedCourse)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == id);

            if (course == null)
            {
                return NotFound(new
                {
                    message = "Course not found."
                });
            }

            course.Title = updatedCourse.Title;
            course.ShortDescription = updatedCourse.ShortDescription;
            course.Description = updatedCourse.Description;
            course.ThumbnailUrl = updatedCourse.ThumbnailUrl;
            course.Category = updatedCourse.Category;
            course.Level = updatedCourse.Level;
            course.EstimatedMinutes = updatedCourse.EstimatedMinutes;
            course.IsPublished = updatedCourse.IsPublished;
            course.IsFeatured = updatedCourse.IsFeatured;
            course.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(course);
        }


        // =========================================================
        // DELETE: api/Courses/5
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == id);

            if (course == null)
            {
                return NotFound(new
                {
                    message = "Course not found."
                });
            }

            _context.Courses.Remove(course);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Course deleted successfully."
            });
        }


        // =========================================================
        // PATCH: api/Courses/5/publish
        // =========================================================

        [HttpPatch("{id:int}/publish")]
        public async Task<IActionResult> PublishCourse(int id)
        {
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == id);

            if (course == null)
            {
                return NotFound(new
                {
                    message = "Course not found."
                });
            }

            course.IsPublished = !course.IsPublished;
            course.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                course.CourseId,
                course.IsPublished,
                message = course.IsPublished
                    ? "Course published successfully."
                    : "Course unpublished successfully."
            });
        }


        // =========================================================
        // PATCH: api/Courses/5/featured
        // =========================================================

        [HttpPatch("{id:int}/featured")]
        public async Task<IActionResult> FeatureCourse(int id)
        {
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == id);

            if (course == null)
            {
                return NotFound(new
                {
                    message = "Course not found."
                });
            }

            course.IsFeatured = !course.IsFeatured;
            course.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                course.CourseId,
                course.IsFeatured,
                message = course.IsFeatured
                    ? "Course marked as featured."
                    : "Course removed from featured courses."
            });
        }

        // =========================================================
        // PUBLIC: POST api/Courses/public-enroll
        // Records enrollment applications directly into the database
        // =========================================================

        [HttpPost("public-enroll")]
        [AllowAnonymous]
        public async Task<IActionResult> PublicEnroll(
            [FromBody] PublicCourseEnrollmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.CourseTitle))
            {
                return BadRequest(new
                {
                    message = "Full name, email, and course title are required."
                });
            }

            var refCode = string.IsNullOrWhiteSpace(request.ReferenceCode)
                ? $"EPIC-ENROLL-{Random.Shared.Next(100000, 999999)}"
                : request.ReferenceCode.Trim();

            // 1. Record intake in DemoRequests for administrative review and tracking
            var intake = new DemoRequest
            {
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim().ToLowerInvariant(),
                Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                ChurchName = $"EPIC Academy - {request.CourseCode}: {request.CourseTitle}",
                Position = $"Academy Enrollment ({request.MemberStatus})",
                Message = $"[EPIC ACADEMY ENROLLMENT APPLICATION]\n" +
                          $"Course Code: {request.CourseCode}\n" +
                          $"Course Title: {request.CourseTitle}\n" +
                          $"Preferred Cohort: {request.Cohort}\n" +
                          $"Member Status: {request.MemberStatus}\n" +
                          $"Life Group Mentor: {(string.IsNullOrWhiteSpace(request.MentorName) ? "N/A" : request.MentorName.Trim())}\n" +
                          $"Reference Code: {refCode}\n" +
                          $"Enrolled At: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\n" +
                          $"Notes: {(string.IsNullOrWhiteSpace(request.Notes) ? "None" : request.Notes.Trim())}",
                Status = "Pending",
                CreatedDate = DateTime.UtcNow
            };

            _context.DemoRequests.Add(intake);

            // 2. If the user already has an active account, automatically link to CourseEnrollments
            int? officialEnrollmentId = null;
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var matchedUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == normalizedEmail && u.IsActive);

            if (matchedUser != null && request.CourseId.HasValue)
            {
                var existingEnrollment = await _context.CourseEnrollments
                    .FirstOrDefaultAsync(e => e.CourseId == request.CourseId.Value && e.UserId == matchedUser.UserId);

                if (existingEnrollment == null && await _context.Courses.AnyAsync(c => c.CourseId == request.CourseId.Value))
                {
                    var enrollment = new CourseEnrollment
                    {
                        CourseId = request.CourseId.Value,
                        UserId = matchedUser.UserId,
                        EnrolledDate = DateTime.UtcNow,
                        ProgressPercentage = 0,
                        IsCompleted = false
                    };
                    _context.CourseEnrollments.Add(enrollment);
                    await _context.SaveChangesAsync();
                    officialEnrollmentId = enrollment.CourseEnrollmentId;
                }
                else if (existingEnrollment != null)
                {
                    officialEnrollmentId = existingEnrollment.CourseEnrollmentId;
                }
            }

            await _context.SaveChangesAsync();

            // 3. Send 1 confirmation email to the enrolled student & 1 notification email to admin
            if (_emailService != null)
            {
                try
                {
                    await _emailService.SendCourseEnrollmentStudentConfirmationAsync(
                        fullName: request.FullName.Trim(),
                        studentEmail: request.Email.Trim().ToLowerInvariant(),
                        courseCode: request.CourseCode,
                        courseTitle: request.CourseTitle,
                        cohort: request.Cohort,
                        memberStatus: request.MemberStatus,
                        mentorName: request.MentorName,
                        referenceCode: refCode,
                        enrolledDate: intake.CreatedDate);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Student confirmation email sending failed: {ex.Message}");
                }

                try
                {
                    await _emailService.SendCourseEnrollmentAdminNotificationAsync(
                        fullName: request.FullName.Trim(),
                        studentEmail: request.Email.Trim().ToLowerInvariant(),
                        phone: request.Phone,
                        courseCode: request.CourseCode,
                        courseTitle: request.CourseTitle,
                        cohort: request.Cohort,
                        memberStatus: request.MemberStatus,
                        mentorName: request.MentorName,
                        referenceCode: refCode,
                        enrolledDate: intake.CreatedDate);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Admin enrollment notification email sending failed: {ex.Message}");
                }
            }

            return Ok(new
            {
                success = true,
                message = "Enrollment application successfully recorded in the EPIC database.",
                intakeId = intake.DemoRequestId,
                officialEnrollmentId,
                referenceCode = refCode,
                courseCode = request.CourseCode,
                courseTitle = request.CourseTitle,
                enrolledDate = intake.CreatedDate
            });
        }
    }

    public class PublicCourseEnrollmentRequest
    {
        public int? CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string MemberStatus { get; set; } = "Active Member";
        public string Cohort { get; set; } = string.Empty;
        public string? MentorName { get; set; }
        public string? ReferenceCode { get; set; }
        public string? Notes { get; set; }
    }
}