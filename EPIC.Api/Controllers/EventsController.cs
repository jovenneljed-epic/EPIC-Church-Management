
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
        // GET CUSTOMER ID FROM JWT
        // =========================================================

        private int? GetCustomerId()
        {
            // Primary claim
            var claim =
                User.FindFirst("customerId");

            if (claim != null &&
                int.TryParse(
                    claim.Value,
                    out var customerId))
            {
                return customerId;
            }

            // Compatibility claim
            claim =
                User.FindFirst("CustomerId");

            if (claim != null &&
                int.TryParse(
                    claim.Value,
                    out customerId))
            {
                return customerId;
            }

            // Tenant compatibility claim
            claim =
                User.FindFirst("tenantId");

            if (claim != null &&
                int.TryParse(
                    claim.Value,
                    out customerId))
            {
                return customerId;
            }

            return null;
        }

        // =========================================================
        // CHECK CLIENT ACCOUNT
        // =========================================================

        private bool IsClientAccount()
        {
            // ASP.NET Core role
            if (User.IsInRole("CLIENT"))
            {
                return true;
            }

            // Explicit role claim compatibility
            var roleClaim =
                User.FindFirst("role")?.Value;

            return string.Equals(
                roleClaim?.Trim(),
                "CLIENT",
                StringComparison.OrdinalIgnoreCase);
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

            return status
                .Trim()
                .ToUpperInvariant();
        }

        // =========================================================
        // GET: api/Events
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            try
            {
                var query =
                    _context.Events
                        .AsNoTracking()
                        .AsQueryable();

                // -------------------------------------------------
                // CLIENT = OWN CUSTOMER ONLY
                // ADMIN = ALL EVENTS
                // -------------------------------------------------

                if (IsClientAccount())
                {
                    var customerId =
                        GetCustomerId();

                    if (!customerId.HasValue)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                        });
                    }

                    query =
                        query.Where(e =>
                            e.CustomerId ==
                            customerId.Value);
                }

                var events =
                    await query
                        .OrderBy(e => e.EventDate)
                        .ThenBy(e => e.StartTime)
                        .ToListAsync();

                return Ok(events);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to load events.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
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
                var query =
                    _context.Events
                        .AsNoTracking()
                        .AsQueryable();

                // -------------------------------------------------
                // CLIENT = OWN CUSTOMER ONLY
                // ADMIN = ALL EVENTS
                // -------------------------------------------------

                if (IsClientAccount())
                {
                    var customerId =
                        GetCustomerId();

                    if (!customerId.HasValue)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                        });
                    }

                    query =
                        query.Where(e =>
                            e.CustomerId ==
                            customerId.Value);
                }

                var today =
                    DateTime.Today;

                var events =
                    await query
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
                    message =
                        "Unable to load upcoming events.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
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
                var query =
                    _context.Events
                        .AsNoTracking()
                        .AsQueryable();

                // -------------------------------------------------
                // CLIENT = OWN CUSTOMER ONLY
                // ADMIN = ALL EVENTS
                // -------------------------------------------------

                if (IsClientAccount())
                {
                    var customerId =
                        GetCustomerId();

                    if (!customerId.HasValue)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                        });
                    }

                    query =
                        query.Where(e =>
                            e.CustomerId ==
                            customerId.Value);
                }

                var churchEvent =
                    await query
                        .FirstOrDefaultAsync(e =>
                            e.EventId == id);

                if (churchEvent == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Event not found."
                    });
                }

                return Ok(churchEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to load event.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
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
                if (churchEvent == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Event data is required."
                    });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // =================================================
                // CUSTOMER ID
                // =================================================

                if (IsClientAccount())
                {
                    var customerId =
                        GetCustomerId();

                    if (!customerId.HasValue)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                        });
                    }

                    // NEVER TRUST FRONTEND CUSTOMER ID
                    churchEvent.CustomerId =
                        customerId.Value;
                }
                else
                {
                    // ADMIN
                    //
                    // Preserve supplied CustomerId.
                    // Default to Customer 1 for the current
                    // single-church installation.

                    if (churchEvent.CustomerId <= 0)
                    {
                        churchEvent.CustomerId = 1;
                    }
                }

                // =================================================
                // VERIFY CUSTOMER
                // =================================================

                var customerExists =
                    await _context.Customers
                        .AsNoTracking()
                        .AnyAsync(c =>
                            c.CustomerId ==
                            churchEvent.CustomerId);

                if (!customerExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "CUSTOMER NOT FOUND."
                    });
                }

                // =================================================
                // SECURITY
                // =================================================

                churchEvent.EventId = 0;

                // =================================================
                // STATUS
                // =================================================

                churchEvent.Status =
                    NormalizeStatus(
                        churchEvent.Status);

                // =================================================
                // AUDIT
                // =================================================

                churchEvent.CreatedAt =
                    DateTime.Now;

                churchEvent.UpdatedAt =
                    null;

                // =================================================
                // NAVIGATION PROPERTIES
                // =================================================

                churchEvent.Customer =
                    null;

                churchEvent.EventAssignments =
                    new List<EventAssignment>();

                churchEvent.EventNeeds =
                    new List<EventNeed>();

                churchEvent.EventChecklists =
                    new List<EventChecklist>();

                // =================================================
                // SAVE
                // =================================================

                _context.Events.Add(
                    churchEvent);

                await _context.SaveChangesAsync();

                // =================================================
                // RESPONSE
                // =================================================

                return CreatedAtAction(
                    nameof(GetEvent),
                    new
                    {
                        id =
                            churchEvent.EventId
                    },
                    churchEvent);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to create event.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to create event.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
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
                if (updatedEvent == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Event data is required."
                    });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // =================================================
                // QUERY
                // =================================================

                var query =
                    _context.Events
                        .AsQueryable();

                // =================================================
                // CLIENT TENANT FILTER
                // =================================================

                if (IsClientAccount())
                {
                    var customerId =
                        GetCustomerId();

                    if (!customerId.HasValue)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                        });
                    }

                    query =
                        query.Where(e =>
                            e.CustomerId ==
                            customerId.Value);
                }

                // =================================================
                // LOAD EXISTING EVENT
                // =================================================

                var existingEvent =
                    await query
                        .FirstOrDefaultAsync(e =>
                            e.EventId == id);

                if (existingEvent == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Event not found."
                    });
                }

                // =================================================
                // EVENT INFORMATION
                // =================================================

                existingEvent.Title =
                    updatedEvent.Title?.Trim()
                    ?? string.Empty;

                existingEvent.EventType =
                    updatedEvent.EventType?.Trim()
                    ?? string.Empty;

                existingEvent.EventDate =
                    updatedEvent.EventDate;

                existingEvent.StartTime =
                    updatedEvent.StartTime;

                existingEvent.EndTime =
                    updatedEvent.EndTime;

                // =================================================
                // LOCATION
                // =================================================

                existingEvent.Venue =
                    string.IsNullOrWhiteSpace(
                        updatedEvent.Venue)
                        ? null
                        : updatedEvent.Venue.Trim();

                // =================================================
                // SPEAKER
                // =================================================

                existingEvent.Speaker =
                    string.IsNullOrWhiteSpace(
                        updatedEvent.Speaker)
                        ? null
                        : updatedEvent.Speaker.Trim();

                // =================================================
                // MINISTRY
                // =================================================

                existingEvent.Ministry =
                    string.IsNullOrWhiteSpace(
                        updatedEvent.Ministry)
                        ? null
                        : updatedEvent.Ministry.Trim();

                // =================================================
                // STATUS
                // =================================================

                existingEvent.Status =
                    NormalizeStatus(
                        updatedEvent.Status);

                // =================================================
                // DESCRIPTION
                // =================================================

                existingEvent.Description =
                    string.IsNullOrWhiteSpace(
                        updatedEvent.Description)
                        ? null
                        : updatedEvent.Description.Trim();

                // =================================================
                // NOTES
                // =================================================

                existingEvent.Notes =
                    string.IsNullOrWhiteSpace(
                        updatedEvent.Notes)
                        ? null
                        : updatedEvent.Notes.Trim();

                // =================================================
                // AUDIT
                // =================================================

                existingEvent.UpdatedAt =
                    DateTime.Now;

                // =================================================
                // IMPORTANT
                //
                // CustomerId is deliberately NOT changed.
                // =================================================

                await _context.SaveChangesAsync();

                return Ok(existingEvent);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to update event.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to update event.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
                });
            }
        }

        // =========================================================
        // DELETE: api/Events/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteEvent(
            int id)
        {
            try
            {
                var query =
                    _context.Events
                        .AsQueryable();

                // =================================================
                // CLIENT TENANT FILTER
                // =================================================

                if (IsClientAccount())
                {
                    var customerId =
                        GetCustomerId();

                    if (!customerId.HasValue)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "CUSTOMER ID NOT FOUND IN CLIENT TOKEN."
                        });
                    }

                    query =
                        query.Where(e =>
                            e.CustomerId ==
                            customerId.Value);
                }

                // =================================================
                // LOAD EVENT
                // =================================================

                var churchEvent =
                    await query
                        .FirstOrDefaultAsync(e =>
                            e.EventId == id);

                if (churchEvent == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Event not found."
                    });
                }

                // =================================================
                // DELETE
                // =================================================

                _context.Events.Remove(
                    churchEvent);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Event deleted successfully.",

                    eventId =
                        id
                });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to delete event because related records may still exist.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to delete event.",

                    error =
                        ex.InnerException?.Message
                        ?? ex.Message
                });
            }
        }
    }
}

