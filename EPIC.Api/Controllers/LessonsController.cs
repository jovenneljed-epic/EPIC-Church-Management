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
    public class LessonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LessonsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/Lessons/module/1
        // =========================================================

        [HttpGet("module/{moduleId:int}")]
        public async Task<IActionResult> GetLessons(int moduleId)
        {
            var moduleExists = await _context.CourseModules
                .AnyAsync(m => m.CourseModuleId == moduleId);

            if (!moduleExists)
            {
                return NotFound(new
                {
                    message = "Course module not found."
                });
            }

            var lessons = await _context.Lessons
                .AsNoTracking()
                .Where(l => l.CourseModuleId == moduleId)
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
                    l.IsFreePreview,
                    l.CreatedDate,
                    l.UpdatedDate
                })
                .ToListAsync();

            return Ok(lessons);
        }


        // =========================================================
        // GET: api/Lessons/1
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetLesson(int id)
        {
            var lesson = await _context.Lessons
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.LessonId == id);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            return Ok(lesson);
        }


        // =========================================================
        // POST: api/Lessons
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateLesson(
            [FromBody] Lesson lesson)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var moduleExists = await _context.CourseModules
                .AnyAsync(m => m.CourseModuleId == lesson.CourseModuleId);

            if (!moduleExists)
            {
                return BadRequest(new
                {
                    message = "The specified course module does not exist."
                });
            }

            lesson.LessonId = 0;
            lesson.CreatedDate = DateTime.UtcNow;
            lesson.UpdatedDate = null;

            var lastSortOrder = await _context.Lessons
                .Where(l => l.CourseModuleId == lesson.CourseModuleId)
                .Select(l => (int?)l.SortOrder)
                .MaxAsync();

            if (lastSortOrder.HasValue)
            {
                lesson.SortOrder = lastSortOrder.Value + 1;
            }
            else
            {
                lesson.SortOrder = 1;
            }

            _context.Lessons.Add(lesson);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetLesson),
                new { id = lesson.LessonId },
                lesson);
        }


        // =========================================================
        // PUT: api/Lessons/1
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateLesson(
            int id,
            [FromBody] Lesson updatedLesson)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.LessonId == id);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            if (lesson.CourseModuleId != updatedLesson.CourseModuleId)
            {
                return BadRequest(new
                {
                    message = "A lesson cannot be moved to another module using this endpoint."
                });
            }

            lesson.Title = updatedLesson.Title;
            lesson.Content = updatedLesson.Content;
            lesson.VideoUrl = updatedLesson.VideoUrl;
            lesson.ResourceUrl = updatedLesson.ResourceUrl;
            lesson.SortOrder = updatedLesson.SortOrder;
            lesson.EstimatedMinutes = updatedLesson.EstimatedMinutes;
            lesson.IsPublished = updatedLesson.IsPublished;
            lesson.IsFreePreview = updatedLesson.IsFreePreview;
            lesson.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(lesson);
        }


        // =========================================================
        // DELETE: api/Lessons/1
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.LessonId == id);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            _context.Lessons.Remove(lesson);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Lesson deleted successfully."
            });
        }


        // =========================================================
        // PATCH: api/Lessons/1/publish
        // =========================================================

        [HttpPatch("{id:int}/publish")]
        public async Task<IActionResult> PublishLesson(int id)
        {
            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.LessonId == id);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            lesson.IsPublished = !lesson.IsPublished;
            lesson.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                lesson.LessonId,
                lesson.IsPublished,
                message = lesson.IsPublished
                    ? "Lesson published successfully."
                    : "Lesson unpublished successfully."
            });
        }


        // =========================================================
        // PATCH: api/Lessons/1/preview
        // =========================================================

        [HttpPatch("{id:int}/preview")]
        public async Task<IActionResult> SetPreview(int id)
        {
            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.LessonId == id);

            if (lesson == null)
            {
                return NotFound(new
                {
                    message = "Lesson not found."
                });
            }

            lesson.IsFreePreview = !lesson.IsFreePreview;
            lesson.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                lesson.LessonId,
                lesson.IsFreePreview,
                message = lesson.IsFreePreview
                    ? "Lesson is now available as a free preview."
                    : "Lesson removed from free preview."
            });
        }
    }
}