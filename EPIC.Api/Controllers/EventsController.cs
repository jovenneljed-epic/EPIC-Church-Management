
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
        // CUSTOMER / TENANT HELPER
        // =========================================================

        private int? GetCustomerId()
        {
            var customerIdClaim =
                User.FindFirst("CustomerId")?.Value
                ?? User.FindFirst("customerId")?.Value;

            if (int.TryParse(customerIdClaim, out int customerId))
            {
                return customerId;
            }

            return null;
        }

        // =========================================================
        // CUSTOMER AUTHORIZATION
        // =========================================================

        private IActionResult CustomerAuthorizationRequired()
        {
            return Unauthorized(new
            {
                message = "Customer authorization is required."
            });
        }

        // =========================================================
        // STATUS NORMALIZATION
        // =========================================================

        private static string NormalizeStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return "SCHEDULED";
            }

            return status.Trim().ToUpperInvariant();
        }

        // =========================================================
        // GET: api/Events
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            try
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return CustomerAuthorizationRequired();
                }

                var events = await _context.Events
                    .AsNoTracking()
                    .Where(e =>
                        e.CustomerId == customerId.Value)
                    .OrderBy(e => e.EventDate)
                    .ThenBy(e => e.StartTime)
                    .ToListAsync();

                return Ok(events);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load events.",
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
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return CustomerAuthorizationRequired();
                }

                var today = DateTime.Today;

                var events = await _context.Events
                    .AsNoTracking()
                    .Where(e =>
                        e.CustomerId == customerId.Value &&
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
                    message = "Unable to load upcoming events.",
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
            try
            {
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return CustomerAuthorizationRequired();
                }

                var churchEvent = await _context.Events
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e =>
                        e.EventId == id &&
                        e.CustomerId == customerId.Value);

                if (churchEvent == null)
                {
                    return NotFound(new
                    {
                        message = "Event not found."
                    });
                }

                return Ok(churchEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to load event.",
                    error = ex.Message
                });
            }
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

                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return CustomerAuthorizationRequired();
                }

                // -------------------------------------------------
                // SECURITY
                // -------------------------------------------------
                // Never trust these values from the frontend.
                // -------------------------------------------------

                churchEvent.EventId = 0;
                churchEvent.CustomerId = customerId.Value;

                // -------------------------------------------------
                // STATUS
                // -------------------------------------------------

                churchEvent.Status =
                    NormalizeStatus(churchEvent.Status);

                // -------------------------------------------------
                // AUDIT
                // -------------------------------------------------

                churchEvent.CreatedAt = DateTime.Now;
                churchEvent.UpdatedAt = null;

                // -------------------------------------------------
                // NAVIGATION PROPERTIES
                // -------------------------------------------------

                churchEvent.Customer = null;
                churchEvent.EventAssignments = new List<EventAssignment>();
                churchEvent.EventNeeds = new List<EventNeed>();
                churchEvent.EventChecklists = new List<EventChecklist>();

                // -------------------------------------------------
                // SAVE
                // -------------------------------------------------

                _context.Events.Add(churchEvent);

                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetEvent),
                    new
                    {
                        id = churchEvent.EventId
                    },
                    churchEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to create event.",
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

                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return CustomerAuthorizationRequired();
                }

                // -------------------------------------------------
                // TENANT ISOLATION
                // -------------------------------------------------

                var existingEvent =
                    await _context.Events
                        .FirstOrDefaultAsync(e =>
                            e.EventId == id &&
                            e.CustomerId == customerId.Value);

                if (existingEvent == null)
                {
                    return NotFound(new
                    {
                        message = "Event not found."
                    });
                }

                // -------------------------------------------------
                // EVENT INFORMATION
                // -------------------------------------------------

                existingEvent.Title =
                    updatedEvent.Title?.Trim() ?? string.Empty;

                existingEvent.EventType =
                    updatedEvent.EventType?.Trim() ?? string.Empty;

                existingEvent.EventDate =
                    updatedEvent.EventDate;

                existingEvent.StartTime =
                    updatedEvent.StartTime;

                existingEvent.EndTime =
                    updatedEvent.EndTime;

                // -------------------------------------------------
                // LOCATION / LEADERSHIP
                // -------------------------------------------------

                existingEvent.Venue =
                    string.IsNullOrWhiteSpace(updatedEvent.Venue)
                        ? null
                        : updatedEvent.Venue.Trim();

                existingEvent.Speaker =
                    string.IsNullOrWhiteSpace(updatedEvent.Speaker)
                        ? null
                        : updatedEvent.Speaker.Trim();

                existingEvent.Ministry =
                    string.IsNullOrWhiteSpace(updatedEvent.Ministry)
                        ? null
                        : updatedEvent.Ministry.Trim();

                // -------------------------------------------------
                // STATUS
                // -------------------------------------------------

                existingEvent.Status =
                    NormalizeStatus(updatedEvent.Status);

                // -------------------------------------------------
                // DESCRIPTION / NOTES
                // -------------------------------------------------

                existingEvent.Description =
                    string.IsNullOrWhiteSpace(updatedEvent.Description)
                        ? null
                        : updatedEvent.Description.Trim();

                existingEvent.Notes =
                    string.IsNullOrWhiteSpace(updatedEvent.Notes)
                        ? null
                        : updatedEvent.Notes.Trim();

                // -------------------------------------------------
                // AUDIT
                // -------------------------------------------------

                existingEvent.UpdatedAt =
                    DateTime.Now;

                // -------------------------------------------------
                // IMPORTANT
                // -------------------------------------------------
                // CustomerId is deliberately NOT updated.
                // This prevents cross-tenant reassignment.
                // -------------------------------------------------

                await _context.SaveChangesAsync();

                return Ok(existingEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to update event.",
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
                var customerId = GetCustomerId();

                if (!customerId.HasValue)
                {
                    return CustomerAuthorizationRequired();
                }

                // -------------------------------------------------
                // TENANT ISOLATION
                // -------------------------------------------------

                var churchEvent =
                    await _context.Events
                        .FirstOrDefaultAsync(e =>
                            e.EventId == id &&
                            e.CustomerId == customerId.Value);

                if (churchEvent == null)
                {
                    return NotFound(new
                    {
                        message = "Event not found."
                    });
                }

                // -------------------------------------------------
                // DELETE
                // -------------------------------------------------

                _context.Events.Remove(churchEvent);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Event deleted successfully.",
                    eventId = id
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to delete event because related records may still exist.",
                    error = ex.InnerException?.Message ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to delete event.",
                    error = ex.Message
                });
            }
        }
    }
}

