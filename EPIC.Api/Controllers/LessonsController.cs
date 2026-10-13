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
            try
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
                        l.LessonType,
                        l.GoogleClassroomUrl,
                        l.GoogleSheetsUrl,
                        l.QuizDataJson,
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
            catch (Exception ex)
            {
                Console.WriteLine($"[LessonsController.GetLessons Error]: {ex.Message}");
                return StatusCode(500, new { message = "Error loading lessons.", detail = ex.Message });
            }
        }


        // =========================================================
        // GET: api/Lessons/1
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetLesson(int id)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[LessonsController.GetLesson Error]: {ex.Message}");
                return StatusCode(500, new { message = "Error loading lesson.", detail = ex.Message });
            }
        }


        // =========================================================
        // POST: api/Lessons
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateLesson(
            [FromBody] Lesson lesson)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[LessonsController.CreateLesson Error]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to create lesson.", detail = ex.Message });
            }
        }


        // =========================================================
        // PUT: api/Lessons/1
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateLesson(
            int id,
            [FromBody] Lesson updatedLesson)
        {
            try
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

                // Allow updating CourseModuleId if specified and exists
                if (updatedLesson.CourseModuleId > 0 && updatedLesson.CourseModuleId != lesson.CourseModuleId)
                {
                    var targetModuleExists = await _context.CourseModules
                        .AnyAsync(m => m.CourseModuleId == updatedLesson.CourseModuleId);
                    if (targetModuleExists)
                    {
                        lesson.CourseModuleId = updatedLesson.CourseModuleId;
                    }
                }

                lesson.Title = updatedLesson.Title;
                lesson.Content = updatedLesson.Content;
                lesson.VideoUrl = updatedLesson.VideoUrl;
                lesson.ResourceUrl = updatedLesson.ResourceUrl;
                lesson.LessonType = updatedLesson.LessonType;
                lesson.GoogleClassroomUrl = updatedLesson.GoogleClassroomUrl;
                lesson.GoogleSheetsUrl = updatedLesson.GoogleSheetsUrl;
                lesson.QuizDataJson = updatedLesson.QuizDataJson;
                lesson.SortOrder = updatedLesson.SortOrder;
                lesson.EstimatedMinutes = updatedLesson.EstimatedMinutes;
                lesson.IsPublished = updatedLesson.IsPublished;
                lesson.IsFreePreview = updatedLesson.IsFreePreview;
                lesson.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(lesson);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LessonsController.UpdateLesson Error]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to update lesson.", detail = ex.Message });
            }
        }


        // =========================================================
        // DELETE: api/Lessons/1
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[LessonsController.DeleteLesson Error]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to delete lesson.", detail = ex.Message });
            }
        }


        // =========================================================
        // PATCH: api/Lessons/1/publish
        // =========================================================

        [HttpPatch("{id:int}/publish")]
        public async Task<IActionResult> PublishLesson(int id)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[LessonsController.PublishLesson Error]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to update lesson publish status.", detail = ex.Message });
            }
        }


        // =========================================================
        // PATCH: api/Lessons/1/preview
        // =========================================================

        [HttpPatch("{id:int}/preview")]
        public async Task<IActionResult> SetPreview(int id)
        {
            try
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
            catch (Exception ex)
            {
                Console.WriteLine($"[LessonsController.SetPreview Error]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to update lesson preview status.", detail = ex.Message });
            }
        }
    }
}