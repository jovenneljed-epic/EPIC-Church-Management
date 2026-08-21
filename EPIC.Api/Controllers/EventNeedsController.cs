
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
    public class EventNeedsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EventNeedsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL
        // GET: api/EventNeeds
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var needs = await _context.EventNeeds
                    .AsNoTracking()
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new
                    {
                        eventNeedId = n.EventNeedId,
                        eventId = n.EventId,

                        needName = n.NeedName,
                        description = n.Description,
                        category = n.Category,

                        quantity = n.Quantity,
                        unit = n.Unit,

                        responsiblePerson = n.ResponsiblePerson,
                        responsibleMemberId = n.ResponsibleMemberId,

                        status = n.Status,
                        priority = n.Priority,

                        notes = n.Notes,

                        neededBy = n.NeededBy,

                        createdAt = n.CreatedAt,
                        updatedAt = n.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(needs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load event needs.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET BY EVENT
        // GET: api/EventNeeds/event/{eventId}
        // =========================================================

        [HttpGet("event/{eventId:int}")]
        public async Task<IActionResult> GetByEvent(int eventId)
        {
            try
            {
                var eventExists = await _context.Events
                    .AsNoTracking()
                    .AnyAsync(e => e.EventId == eventId);

                if (!eventExists)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Event not found.",
                        eventId
                    });
                }

                var needs = await _context.EventNeeds
                    .AsNoTracking()
                    .Where(n => n.EventId == eventId)
                    .OrderBy(n => n.NeededBy)
                    .ThenByDescending(n => n.CreatedAt)
                    .Select(n => new
                    {
                        eventNeedId = n.EventNeedId,
                        eventId = n.EventId,

                        needName = n.NeedName,
                        description = n.Description,
                        category = n.Category,

                        quantity = n.Quantity,
                        unit = n.Unit,

                        responsiblePerson = n.ResponsiblePerson,
                        responsibleMemberId = n.ResponsibleMemberId,

                        status = n.Status,
                        priority = n.Priority,

                        notes = n.Notes,

                        neededBy = n.NeededBy,

                        createdAt = n.CreatedAt,
                        updatedAt = n.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(needs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load event needs.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET SINGLE
        // GET: api/EventNeeds/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var need = await _context.EventNeeds
                    .AsNoTracking()
                    .Where(n => n.EventNeedId == id)
                    .Select(n => new
                    {
                        eventNeedId = n.EventNeedId,
                        eventId = n.EventId,

                        needName = n.NeedName,
                        description = n.Description,
                        category = n.Category,

                        quantity = n.Quantity,
                        unit = n.Unit,

                        responsiblePerson = n.ResponsiblePerson,
                        responsibleMemberId = n.ResponsibleMemberId,

                        status = n.Status,
                        priority = n.Priority,

                        notes = n.Notes,

                        neededBy = n.NeededBy,

                        createdAt = n.CreatedAt,
                        updatedAt = n.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (need == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Event need not found."
                    });
                }

                return Ok(need);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load event need.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // CREATE
        // POST: api/EventNeeds
        // =========================================================

        // =========================================================
        // CREATE
        // POST: api/EventNeeds
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] EventNeed model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Event need data is required."
                    });
                }

                // -------------------------------------------------
                // EVENT VALIDATION
                // -------------------------------------------------

                if (model.EventId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "EventId is required."
                    });
                }

                var eventExists = await _context.Events
                    .AsNoTracking()
                    .AnyAsync(e => e.EventId == model.EventId);

                if (!eventExists)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "The selected event does not exist."
                    });
                }

                // -------------------------------------------------
                // NEED NAME
                // -------------------------------------------------

                if (string.IsNullOrWhiteSpace(model.NeedName))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "NeedName is required."
                    });
                }

                // -------------------------------------------------
                // NORMALIZE
                // -------------------------------------------------

                model.NeedName = model.NeedName.Trim();

                model.Description =
                    NormalizeText(model.Description);

                model.Category =
                    NormalizeText(model.Category);

                model.Unit =
                    NormalizeText(model.Unit);

                model.ResponsiblePerson =
                    NormalizeText(model.ResponsiblePerson);

                model.Notes =
                    NormalizeText(model.Notes);

                // -------------------------------------------------
                // QUANTITY
                // -------------------------------------------------

                if (model.Quantity <= 0)
                {
                    model.Quantity = 1;
                }

                // -------------------------------------------------
                // STATUS
                // -------------------------------------------------

                model.Status =
                    NormalizeStatus(
                        model.Status,
                        "PENDING");

                // -------------------------------------------------
                // PRIORITY
                // -------------------------------------------------

                model.Priority =
                    NormalizeStatus(
                        model.Priority,
                        "NORMAL");

                // -------------------------------------------------
                // VALID STATUS
                // -------------------------------------------------

                var validStatuses = new[]
                {
            "PENDING",
            "IN_PROGRESS",
            "READY",
            "CANCELLED"
        };

                if (!validStatuses.Contains(model.Status))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid event need status.",
                        allowedStatuses = validStatuses
                    });
                }

                // -------------------------------------------------
                // VALID PRIORITY
                // -------------------------------------------------

                var validPriorities = new[]
                {
            "LOW",
            "NORMAL",
            "HIGH",
            "URGENT"
        };

                if (!validPriorities.Contains(model.Priority))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid event need priority.",
                        allowedPriorities = validPriorities
                    });
                }

                // -------------------------------------------------
                // RESPONSIBLE MEMBER
                // -------------------------------------------------

                if (model.ResponsibleMemberId.HasValue)
                {
                    var memberExists = await _context.Members
                        .AsNoTracking()
                        .AnyAsync(m =>
                            m.MemberId ==
                            model.ResponsibleMemberId.Value);

                    if (!memberExists)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                "The selected responsible member does not exist."
                        });
                    }
                }

                // -------------------------------------------------
                // IMPORTANT
                // DO NOT ATTACH NAVIGATION OBJECTS
                // -------------------------------------------------

                model.EventNeedId = 0;

                model.Event = null;

                model.ResponsibleMember = null;

                model.CreatedAt = DateTime.Now;

                model.UpdatedAt = null;

                // -------------------------------------------------
                // SAVE
                // -------------------------------------------------

                _context.EventNeeds.Add(model);

                await _context.SaveChangesAsync();

                // -------------------------------------------------
                // RETURN A FLAT DTO
                //
                // DO NOT return model directly.
                // DO NOT use CreatedAtAction here.
                // -------------------------------------------------

                var result = new
                {
                    eventNeedId = model.EventNeedId,
                    eventId = model.EventId,

                    needName = model.NeedName,
                    description = model.Description,
                    category = model.Category,

                    quantity = model.Quantity,
                    unit = model.Unit,

                    responsiblePerson =
                        model.ResponsiblePerson,

                    responsibleMemberId =
                        model.ResponsibleMemberId,

                    status = model.Status,
                    priority = model.Priority,

                    notes = model.Notes,

                    neededBy = model.NeededBy,

                    createdAt = model.CreatedAt,
                    updatedAt = model.UpdatedAt
                };

                return Ok(new
                {
                    success = true,
                    message = "Event need created successfully.",
                    eventNeed = result
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[EventNeedsController] CREATE ERROR: {ex}");

                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to create event need.",
                    error = ex.Message,
                    innerError =
                        ex.InnerException?.Message
                });
            }
        }

        // =========================================================
        // UPDATE
        // PUT: api/EventNeeds/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] EventNeed model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Event need data is required."
                    });
                }

                var existing =
                    await _context.EventNeeds
                        .FirstOrDefaultAsync(n =>
                            n.EventNeedId == id);

                if (existing == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message =
                            "Event need not found."
                    });
                }

                // -------------------------------------------------
                // EVENT CANNOT CHANGE
                // -------------------------------------------------

                if (model.EventId > 0 &&
                    model.EventId != existing.EventId)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "The event of an existing event need cannot be changed."
                    });
                }

                // -------------------------------------------------
                // NEED NAME
                // -------------------------------------------------

                if (string.IsNullOrWhiteSpace(
                    model.NeedName))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "NeedName is required."
                    });
                }

                // -------------------------------------------------
                // UPDATE
                // -------------------------------------------------

                existing.NeedName =
                    model.NeedName.Trim();

                existing.Description =
                    NormalizeText(
                        model.Description);

                existing.Category =
                    NormalizeText(
                        model.Category);

                existing.Quantity =
                    model.Quantity <= 0
                        ? 1
                        : model.Quantity;

                existing.Unit =
                    NormalizeText(model.Unit);

                existing.ResponsiblePerson =
                    NormalizeText(
                        model.ResponsiblePerson);

                existing.ResponsibleMemberId =
                    model.ResponsibleMemberId;

                existing.Status =
                    NormalizeStatus(
                        model.Status,
                        "PENDING");

                existing.Priority =
                    NormalizeStatus(
                        model.Priority,
                        "NORMAL");

                existing.Notes =
                    NormalizeText(model.Notes);

                existing.NeededBy =
                    model.NeededBy;

                existing.UpdatedAt =
                    DateTime.Now;

                // -------------------------------------------------
                // MEMBER VALIDATION
                // -------------------------------------------------

                if (existing.ResponsibleMemberId
                    .HasValue)
                {
                    var memberExists =
                        await _context.Members
                            .AsNoTracking()
                            .AnyAsync(m =>
                                m.MemberId ==
                                existing.ResponsibleMemberId.Value);

                    if (!memberExists)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message =
                                "The selected responsible member does not exist."
                        });
                    }
                }

                await _context.SaveChangesAsync();

                // -------------------------------------------------
                // RETURN DTO ONLY
                // -------------------------------------------------

                var updated =
                    await _context.EventNeeds
                        .AsNoTracking()
                        .Where(n =>
                            n.EventNeedId == id)
                        .Select(n => new
                        {
                            eventNeedId =
                                n.EventNeedId,

                            eventId =
                                n.EventId,

                            needName =
                                n.NeedName,

                            description =
                                n.Description,

                            category =
                                n.Category,

                            quantity =
                                n.Quantity,

                            unit =
                                n.Unit,

                            responsiblePerson =
                                n.ResponsiblePerson,

                            responsibleMemberId =
                                n.ResponsibleMemberId,

                            status =
                                n.Status,

                            priority =
                                n.Priority,

                            notes =
                                n.Notes,

                            neededBy =
                                n.NeededBy,

                            createdAt =
                                n.CreatedAt,

                            updatedAt =
                                n.UpdatedAt
                        })
                        .FirstAsync();

                return Ok(new
                {
                    success = true,
                    message =
                        "Event need updated successfully.",
                    eventNeed = updated
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message =
                        "Unable to update event need.",
                    error = ex.Message,
                    innerError =
                        ex.InnerException?.Message
                });
            }
        }

        // =========================================================
        // DELETE
        // DELETE: api/EventNeeds/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var existing =
                    await _context.EventNeeds
                        .FirstOrDefaultAsync(n =>
                            n.EventNeedId == id);

                if (existing == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message =
                            "Event need not found."
                    });
                }

                _context.EventNeeds.Remove(existing);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message =
                        "Event need deleted successfully.",
                    eventNeedId = id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message =
                        "Unable to delete event need.",
                    error = ex.Message,
                    innerError =
                        ex.InnerException?.Message
                });
            }
        }

        // =========================================================
        // HELPERS
        // =========================================================

        private static string? NormalizeText(
            string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim();
        }

        private static string NormalizeStatus(
            string? value,
            string defaultValue)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return defaultValue;
            }

            return value
                .Trim()
                .Replace("-", "_")
                .Replace(" ", "_")
                .ToUpperInvariant();
        }
    }
}

