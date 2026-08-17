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
    public class CourseModulesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CourseModulesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/CourseModules/course/1
        // =========================================================

        [HttpGet("course/{courseId:int}")]
        public async Task<IActionResult> GetModules(int courseId)
        {
            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseId == courseId);

            if (!courseExists)
            {
                return NotFound(new
                {
                    message = "Course not found."
                });
            }

            var modules = await _context.CourseModules
                .AsNoTracking()
                .Where(m => m.CourseId == courseId)
                .OrderBy(m => m.SortOrder)
                .Select(m => new
                {
                    m.CourseModuleId,
                    m.CourseId,
                    m.Title,
                    m.Description,
                    m.SortOrder,
                    m.IsPublished,

                    LessonCount = m.Lessons.Count()
                })
                .ToListAsync();

            return Ok(modules);
        }


        // =========================================================
        // GET: api/CourseModules/1
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetModule(int id)
        {
            var module = await _context.CourseModules
                .AsNoTracking()
                .Include(m => m.Lessons
                    .OrderBy(l => l.SortOrder))
                .FirstOrDefaultAsync(m => m.CourseModuleId == id);

            if (module == null)
            {
                return NotFound(new
                {
                    message = "Course module not found."
                });
            }

            return Ok(module);
        }


        // =========================================================
        // POST: api/CourseModules
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateModule(
            [FromBody] CourseModule module)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseId == module.CourseId);

            if (!courseExists)
            {
                return BadRequest(new
                {
                    message = "The specified course does not exist."
                });
            }

            module.CourseModuleId = 0;

            var lastSortOrder = await _context.CourseModules
                .Where(m => m.CourseId == module.CourseId)
                .Select(m => (int?)m.SortOrder)
                .MaxAsync();

            if (lastSortOrder.HasValue)
            {
                module.SortOrder = lastSortOrder.Value + 1;
            }
            else
            {
                module.SortOrder = 1;
            }

            _context.CourseModules.Add(module);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetModule),
                new { id = module.CourseModuleId },
                module);
        }


        // =========================================================
        // PUT: api/CourseModules/1
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateModule(
            int id,
            [FromBody] CourseModule updatedModule)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var module = await _context.CourseModules
                .FirstOrDefaultAsync(m => m.CourseModuleId == id);

            if (module == null)
            {
                return NotFound(new
                {
                    message = "Course module not found."
                });
            }

            if (module.CourseId != updatedModule.CourseId)
            {
                return BadRequest(new
                {
                    message = "A module cannot be moved to another course using this endpoint."
                });
            }

            module.Title = updatedModule.Title;
            module.Description = updatedModule.Description;
            module.SortOrder = updatedModule.SortOrder;
            module.IsPublished = updatedModule.IsPublished;

            await _context.SaveChangesAsync();

            return Ok(module);
        }


        // =========================================================
        // DELETE: api/CourseModules/1
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteModule(int id)
        {
            var module = await _context.CourseModules
                .FirstOrDefaultAsync(m => m.CourseModuleId == id);

            if (module == null)
            {
                return NotFound(new
                {
                    message = "Course module not found."
                });
            }

            _context.CourseModules.Remove(module);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Course module deleted successfully."
            });
        }


        // =========================================================
        // PATCH: api/CourseModules/1/publish
        // =========================================================

        [HttpPatch("{id:int}/publish")]
        public async Task<IActionResult> PublishModule(int id)
        {
            var module = await _context.CourseModules
                .FirstOrDefaultAsync(m => m.CourseModuleId == id);

            if (module == null)
            {
                return NotFound(new
                {
                    message = "Course module not found."
                });
            }

            module.IsPublished = !module.IsPublished;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                module.CourseModuleId,
                module.IsPublished,
                message = module.IsPublished
                    ? "Module published successfully."
                    : "Module unpublished successfully."
            });
        }
    }
}