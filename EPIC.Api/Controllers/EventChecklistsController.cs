using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventChecklistsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EventChecklistsController(ApplicationDbContext context)
        {
            _context = context;
        }


        // =========================================================
        // GET: api/EventChecklists
        // =========================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EventChecklist>>>
            GetEventChecklists()
        {
            var checklists = await _context.EventChecklists
                .AsNoTracking()
                .Include(c => c.Event)
                .Include(c => c.AssignedMember)
                .Include(c => c.CompletedByMember)
                .OrderBy(c => c.EventId)
                .ThenBy(c => c.SortOrder)
                .ThenBy(c => c.EventChecklistId)
                .ToListAsync();

            return Ok(checklists);
        }


        // =========================================================
        // GET: api/EventChecklists/5
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<EventChecklist>>
            GetEventChecklist(int id)
        {
            var checklist = await _context.EventChecklists
                .AsNoTracking()
                .Include(c => c.Event)
                .Include(c => c.AssignedMember)
                .Include(c => c.CompletedByMember)
                .FirstOrDefaultAsync(c =>
                    c.EventChecklistId == id);

            if (checklist == null)
            {
                return NotFound(new
                {
                    message = "Event checklist item not found."
                });
            }

            return Ok(checklist);
        }


        // =========================================================
        // GET: api/EventChecklists/event/5
        // =========================================================

        [HttpGet("event/{eventId:int}")]
        public async Task<ActionResult<IEnumerable<EventChecklist>>>
            GetEventChecklistsByEvent(int eventId)
        {
            var eventExists = await _context.Events
                .AnyAsync(e => e.EventId == eventId);

            if (!eventExists)
            {
                return NotFound(new
                {
                    message = "Event not found."
                });
            }

            var checklists = await _context.EventChecklists
                .AsNoTracking()
                .Include(c => c.AssignedMember)
                .Include(c => c.CompletedByMember)
                .Where(c => c.EventId == eventId)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.EventChecklistId)
                .ToListAsync();

            return Ok(checklists);
        }


        // =========================================================
        // GET: api/EventChecklists/member/5
        // =========================================================

        [HttpGet("member/{memberId:int}")]
        public async Task<ActionResult<IEnumerable<EventChecklist>>>
            GetEventChecklistsByMember(int memberId)
        {
            var memberExists = await _context.Members
                .AnyAsync(m => m.MemberId == memberId);

            if (!memberExists)
            {
                return NotFound(new
                {
                    message = "Member not found."
                });
            }

            var checklists = await _context.EventChecklists
                .AsNoTracking()
                .Include(c => c.Event)
                .Include(c => c.AssignedMember)
                .Where(c => c.AssignedMemberId == memberId)
                .OrderBy(c => c.DueDate)
                .ThenBy(c => c.SortOrder)
                .ToListAsync();

            return Ok(checklists);
        }


        // =========================================================
        // GET: api/EventChecklists/status/PENDING
        // =========================================================

        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<EventChecklist>>>
            GetEventChecklistsByStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return BadRequest(new
                {
                    message = "Status is required."
                });
            }

            status = status.Trim().ToUpper();

            var checklists = await _context.EventChecklists
                .AsNoTracking()
                .Include(c => c.Event)
                .Include(c => c.AssignedMember)
                .Where(c => c.Status.ToUpper() == status)
                .OrderBy(c => c.DueDate)
                .ThenBy(c => c.SortOrder)
                .ToListAsync();

            return Ok(checklists);
        }


        // =========================================================
        // POST: api/EventChecklists
        // =========================================================

        [HttpPost]
        public async Task<ActionResult<EventChecklist>>
            CreateEventChecklist(
                [FromBody] EventChecklist checklist)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var eventExists = await _context.Events
                .AnyAsync(e => e.EventId == checklist.EventId);

            if (!eventExists)
            {
                return BadRequest(new
                {
                    message = "The specified event does not exist."
                });
            }

            if (checklist.AssignedMemberId.HasValue)
            {
                var memberExists = await _context.Members
                    .AnyAsync(m =>
                        m.MemberId == checklist.AssignedMemberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        message = "The assigned member does not exist."
                    });
                }
            }

            checklist.EventChecklistId = 0;

            checklist.TaskName = checklist.TaskName.Trim();

            checklist.Status =
                string.IsNullOrWhiteSpace(checklist.Status)
                    ? "PENDING"
                    : checklist.Status.Trim().ToUpper();

            checklist.Priority =
                string.IsNullOrWhiteSpace(checklist.Priority)
                    ? "NORMAL"
                    : checklist.Priority.Trim().ToUpper();

            checklist.CreatedAt = DateTime.Now;
            checklist.UpdatedAt = null;

            if (checklist.Status != "COMPLETED")
            {
                checklist.CompletedAt = null;
                checklist.CompletedByMemberId = null;
            }

            _context.EventChecklists.Add(checklist);

            await _context.SaveChangesAsync();

            var createdChecklist = await _context.EventChecklists
                .AsNoTracking()
                .Include(c => c.Event)
                .Include(c => c.AssignedMember)
                .Include(c => c.CompletedByMember)
                .FirstAsync(c =>
                    c.EventChecklistId ==
                    checklist.EventChecklistId);

            return CreatedAtAction(
                nameof(GetEventChecklist),
                new { id = checklist.EventChecklistId },
                createdChecklist);
        }


        // =========================================================
        // PUT: api/EventChecklists/5
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateEventChecklist(
            int id,
            [FromBody] EventChecklist checklist)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (id != checklist.EventChecklistId)
            {
                return BadRequest(new
                {
                    message =
                        "The ID in the URL does not match EventChecklistId."
                });
            }

            var existingChecklist =
                await _context.EventChecklists
                    .FirstOrDefaultAsync(c =>
                        c.EventChecklistId == id);

            if (existingChecklist == null)
            {
                return NotFound(new
                {
                    message = "Event checklist item not found."
                });
            }

            var eventExists = await _context.Events
                .AnyAsync(e => e.EventId == checklist.EventId);

            if (!eventExists)
            {
                return BadRequest(new
                {
                    message = "The specified event does not exist."
                });
            }

            if (checklist.AssignedMemberId.HasValue)
            {
                var memberExists = await _context.Members
                    .AnyAsync(m =>
                        m.MemberId ==
                        checklist.AssignedMemberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        message = "The assigned member does not exist."
                    });
                }
            }

            if (checklist.CompletedByMemberId.HasValue)
            {
                var memberExists = await _context.Members
                    .AnyAsync(m =>
                        m.MemberId ==
                        checklist.CompletedByMemberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The completed-by member does not exist."
                    });
                }
            }

            existingChecklist.EventId =
                checklist.EventId;

            existingChecklist.TaskName =
                checklist.TaskName.Trim();

            existingChecklist.Description =
                checklist.Description;

            existingChecklist.Category =
                checklist.Category;

            existingChecklist.AssignedMemberId =
                checklist.AssignedMemberId;

            existingChecklist.AssignedPerson =
                checklist.AssignedPerson;

            existingChecklist.Status =
                string.IsNullOrWhiteSpace(checklist.Status)
                    ? "PENDING"
                    : checklist.Status.Trim().ToUpper();

            existingChecklist.Priority =
                string.IsNullOrWhiteSpace(checklist.Priority)
                    ? "NORMAL"
                    : checklist.Priority.Trim().ToUpper();

            existingChecklist.SortOrder =
                checklist.SortOrder;

            existingChecklist.DueDate =
                checklist.DueDate;

            existingChecklist.CompletedAt =
                checklist.CompletedAt;

            existingChecklist.CompletedByMemberId =
                checklist.CompletedByMemberId;

            existingChecklist.Notes =
                checklist.Notes;

            existingChecklist.UpdatedAt =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }


        // =========================================================
        // PATCH: api/EventChecklists/5/status
        // =========================================================

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] UpdateEventChecklistStatusRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new
                {
                    message = "Status is required."
                });
            }

            var allowedStatuses = new[]
            {
                "PENDING",
                "IN_PROGRESS",
                "COMPLETED",
                "SKIPPED"
            };

            var status = request.Status.Trim().ToUpper();

            if (!allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid status. Allowed values: PENDING, IN_PROGRESS, COMPLETED, SKIPPED."
                });
            }

            var checklist = await _context.EventChecklists
                .FirstOrDefaultAsync(c =>
                    c.EventChecklistId == id);

            if (checklist == null)
            {
                return NotFound(new
                {
                    message = "Event checklist item not found."
                });
            }

            checklist.Status = status;
            checklist.UpdatedAt = DateTime.Now;

            if (status == "COMPLETED")
            {
                checklist.CompletedAt = DateTime.Now;
            }
            else
            {
                checklist.CompletedAt = null;
                checklist.CompletedByMemberId = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Checklist status updated successfully.",
                eventChecklistId =
                    checklist.EventChecklistId,
                status = checklist.Status,
                completedAt =
                    checklist.CompletedAt
            });
        }


        // =========================================================
        // PATCH: api/EventChecklists/5/complete
        // =========================================================

        [HttpPatch("{id:int}/complete")]
        public async Task<IActionResult> CompleteChecklist(
            int id,
            [FromBody] CompleteEventChecklistRequest request)
        {
            var checklist = await _context.EventChecklists
                .FirstOrDefaultAsync(c =>
                    c.EventChecklistId == id);

            if (checklist == null)
            {
                return NotFound(new
                {
                    message = "Event checklist item not found."
                });
            }

            if (request.CompletedByMemberId.HasValue)
            {
                var memberExists = await _context.Members
                    .AnyAsync(m =>
                        m.MemberId ==
                        request.CompletedByMemberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The specified member does not exist."
                    });
                }
            }

            checklist.Status = "COMPLETED";
            checklist.CompletedAt = DateTime.Now;
            checklist.CompletedByMemberId =
                request.CompletedByMemberId;
            checklist.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Checklist item completed successfully.",
                eventChecklistId =
                    checklist.EventChecklistId,
                status = checklist.Status,
                completedAt =
                    checklist.CompletedAt,
                completedByMemberId =
                    checklist.CompletedByMemberId
            });
        }


        // =========================================================
        // PATCH: api/EventChecklists/5/assign
        // =========================================================

        [HttpPatch("{id:int}/assign")]
        public async Task<IActionResult> AssignChecklist(
            int id,
            [FromBody] AssignEventChecklistRequest request)
        {
            var checklist = await _context.EventChecklists
                .FirstOrDefaultAsync(c =>
                    c.EventChecklistId == id);

            if (checklist == null)
            {
                return NotFound(new
                {
                    message = "Event checklist item not found."
                });
            }

            if (request.AssignedMemberId.HasValue)
            {
                var memberExists = await _context.Members
                    .AnyAsync(m =>
                        m.MemberId ==
                        request.AssignedMemberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The specified member does not exist."
                    });
                }
            }

            checklist.AssignedMemberId =
                request.AssignedMemberId;

            checklist.AssignedPerson =
                request.AssignedPerson;

            checklist.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Checklist assignment updated successfully.",
                eventChecklistId =
                    checklist.EventChecklistId,
                assignedMemberId =
                    checklist.AssignedMemberId,
                assignedPerson =
                    checklist.AssignedPerson
            });
        }


        // =========================================================
        // DELETE: api/EventChecklists/5
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteEventChecklist(
            int id)
        {
            var checklist = await _context.EventChecklists
                .FirstOrDefaultAsync(c =>
                    c.EventChecklistId == id);

            if (checklist == null)
            {
                return NotFound(new
                {
                    message =
                        "Event checklist item not found."
                });
            }

            _context.EventChecklists.Remove(checklist);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Event checklist item deleted successfully.",
                eventChecklistId = id
            });
        }
    }


    // =============================================================
    // REQUEST DTOs
    // =============================================================

    public class UpdateEventChecklistStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }


    public class CompleteEventChecklistRequest
    {
        public int? CompletedByMemberId { get; set; }
    }


    public class AssignEventChecklistRequest
    {
        public int? AssignedMemberId { get; set; }

        public string? AssignedPerson { get; set; }
    }
}