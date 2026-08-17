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
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CoursesController(ApplicationDbContext context)
        {
            _context = context;
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
    }
}