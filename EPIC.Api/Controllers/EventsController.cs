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
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EventsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/Events
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            try
            {
                var events = await _context.Events
                    .AsNoTracking()
                    .OrderBy(e => e.EventDate)
                    .ThenBy(e => e.StartTime)
                    .ToListAsync();

                return Ok(events);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load church services.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET: api/Events/upcoming
        // =========================================================

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingEvents()
        {
            try
            {
                var today = DateTime.Today;

                var events = await _context.Events
                    .AsNoTracking()
                    .Where(e =>
                        e.EventDate >= today &&
                        e.Status != "CANCELLED")
                    .OrderBy(e => e.EventDate)
                    .ThenBy(e => e.StartTime)
                    .Take(10)
                    .ToListAsync();

                return Ok(events);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load upcoming church services.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET: api/Events/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetEvent(int id)
        {
            var churchEvent = await _context.Events
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EventId == id);

            if (churchEvent == null)
            {
                return NotFound(new
                {
                    message = "Church service not found."
                });
            }

            return Ok(churchEvent);
        }

        // =========================================================
        // POST: api/Events
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateEvent(
            [FromBody] Event churchEvent)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                churchEvent.EventId = 0;

                if (string.IsNullOrWhiteSpace(churchEvent.Status))
                {
                    churchEvent.Status = "SCHEDULED";
                }

                churchEvent.Status =
                    churchEvent.Status.Trim().ToUpper();

                churchEvent.CreatedAt = DateTime.Now;

                _context.Events.Add(churchEvent);

                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetEvent),
                    new { id = churchEvent.EventId },
                    churchEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to create church service.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // PUT: api/Events/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateEvent(
            int id,
            [FromBody] Event updatedEvent)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingEvent =
                    await _context.Events
                        .FirstOrDefaultAsync(e =>
                            e.EventId == id);

                if (existingEvent == null)
                {
                    return NotFound(new
                    {
                        message = "Church service not found."
                    });
                }

                existingEvent.Title =
                    updatedEvent.Title;

                existingEvent.EventType =
                    updatedEvent.EventType;

                existingEvent.EventDate =
                    updatedEvent.EventDate;

                existingEvent.StartTime =
                    updatedEvent.StartTime;

                existingEvent.EndTime =
                    updatedEvent.EndTime;

                existingEvent.Venue =
                    updatedEvent.Venue;

                existingEvent.Speaker =
                    updatedEvent.Speaker;

                existingEvent.Ministry =
                    updatedEvent.Ministry;

                existingEvent.Status =
                    string.IsNullOrWhiteSpace(
                        updatedEvent.Status)
                        ? "SCHEDULED"
                        : updatedEvent.Status
                            .Trim()
                            .ToUpper();

                existingEvent.Description =
                    updatedEvent.Description;

                existingEvent.Notes =
                    updatedEvent.Notes;

                existingEvent.UpdatedAt =
                    DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(existingEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to update church service.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // DELETE: api/Events/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            try
            {
                var churchEvent =
                    await _context.Events
                        .FirstOrDefaultAsync(e =>
                            e.EventId == id);

                if (churchEvent == null)
                {
                    return NotFound(new
                    {
                        message = "Church service not found."
                    });
                }

                _context.Events.Remove(churchEvent);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Church service deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to delete church service.",
                    error = ex.Message
                });
            }
        }
    }
}