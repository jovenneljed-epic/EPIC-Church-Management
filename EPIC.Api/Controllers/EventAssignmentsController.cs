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
    public class EventAssignmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EventAssignmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL
        // GET: /api/EventAssignments
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var assignments = await _context.EventAssignments
                .AsNoTracking()
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(assignments);
        }

        // =========================================================
        // GET BY EVENT
        // GET: /api/EventAssignments/event/{eventId}
        // =========================================================

        [HttpGet("event/{eventId:int}")]
        public async Task<IActionResult> GetByEvent(int eventId)
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

            var assignments = await _context.EventAssignments
                .AsNoTracking()
                .Where(a => a.EventId == eventId)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            return Ok(assignments);
        }

        // =========================================================
        // GET BY DEPARTMENT
        // GET: /api/EventAssignments/department/{departmentId}
        // =========================================================

        [HttpGet("department/{departmentId:int}")]
        public async Task<IActionResult> GetByDepartment(int departmentId)
        {
            var assignments = await _context.EventAssignments
                .AsNoTracking()
                .Where(a => a.EventDepartmentId == departmentId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(assignments);
        }

        // =========================================================
        // GET BY MEMBER
        // GET: /api/EventAssignments/member/{memberId}
        // =========================================================

        [HttpGet("member/{memberId:int}")]
        public async Task<IActionResult> GetByMember(int memberId)
        {
            var memberExists = await _context.Members
                .AsNoTracking()
                .AnyAsync(m => m.MemberId == memberId);

            if (!memberExists)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Member not found.",
                    memberId
                });
            }

            var assignments = await _context.EventAssignments
                .AsNoTracking()
                .Where(a => a.MemberId == memberId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(assignments);
        }

        // =========================================================
        // GET SINGLE
        // GET: /api/EventAssignments/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var assignment = await GetAssignment(id);

            if (assignment == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Event assignment not found."
                });
            }

            return Ok(assignment);
        }

        // =========================================================
        // CREATE
        // POST: /api/EventAssignments
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] EventAssignment model)
        {
            if (model == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Assignment data is required."
                });
            }

            // -----------------------------------------------------
            // EVENT VALIDATION
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // NORMALIZE
            // -----------------------------------------------------

            model.RoleName = NormalizeText(model.RoleName);
            model.AssignedPerson = NormalizeText(model.AssignedPerson);
            model.DepartmentName = NormalizeText(model.DepartmentName);
            model.Notes = NormalizeText(model.Notes);

            model.AssignmentStatus =
                NormalizeStatus(
                    model.AssignmentStatus,
                    "PENDING");

            model.Priority =
                NormalizeStatus(
                    model.Priority,
                    "NORMAL");

            // -----------------------------------------------------
            // RELATED ENTITY VALIDATION
            // -----------------------------------------------------

            var relatedValidation =
                await ValidateRelatedEntities(
                    model.EventId,
                    model.EventDepartmentId,
                    model.EventRoleId,
                    model.MemberId);

            if (relatedValidation != null)
            {
                return relatedValidation;
            }

            // -----------------------------------------------------
            // DUPLICATE CHECK
            // -----------------------------------------------------

            var duplicate =
                await AssignmentExistsAsync(
                    model.EventId,
                    model.RoleName,
                    model.AssignedPerson,
                    model.DepartmentName);

            if (duplicate)
            {
                return Conflict(new
                {
                    success = false,
                    message =
                        "This assignment already exists for this event. " +
                        "Please use a different role/person or edit the existing assignment.",
                    eventId = model.EventId,
                    roleName = model.RoleName,
                    assignedPerson = model.AssignedPerson,
                    departmentName = model.DepartmentName
                });
            }

            // -----------------------------------------------------
            // AUDIT VALUES
            // -----------------------------------------------------

            model.CreatedAt = DateTime.Now;
            model.UpdatedAt = null;

            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            _context.EventAssignments.Add(model);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RETURN CREATED RECORD
            //
            // IMPORTANT:
            // Do NOT Include related entities here.
            // -----------------------------------------------------

            var created = await GetAssignment(
                model.EventAssignmentId);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = model.EventAssignmentId
                },
                new
                {
                    success = true,
                    message = "Assignment saved successfully.",
                    assignment = created
                });
        }

        // =========================================================
        // CREATE BULK
        // POST: /api/EventAssignments/bulk
        // =========================================================

        [HttpPost("bulk")]
        public async Task<IActionResult> CreateBulk(
            [FromBody] List<EventAssignment> assignments)
        {
            if (assignments == null ||
                assignments.Count == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "At least one assignment is required."
                });
            }

            // -----------------------------------------------------
            // ALL SAME EVENT
            // -----------------------------------------------------

            var eventIds = assignments
                .Select(a => a.EventId)
                .Distinct()
                .ToList();

            if (eventIds.Count != 1 ||
                eventIds[0] <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "All assignments must belong to the same event."
                });
            }

            var eventId = eventIds[0];

            // -----------------------------------------------------
            // EVENT EXISTS
            // -----------------------------------------------------

            var eventExists = await _context.Events
                .AsNoTracking()
                .AnyAsync(e => e.EventId == eventId);

            if (!eventExists)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "The selected event does not exist."
                });
            }

            // -----------------------------------------------------
            // NORMALIZE + VALIDATE
            // -----------------------------------------------------

            foreach (var assignment in assignments)
            {
                if (assignment.EventId != eventId)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "All assignments must belong to the same event."
                    });
                }

                assignment.RoleName =
                    NormalizeText(assignment.RoleName);

                assignment.AssignedPerson =
                    NormalizeText(assignment.AssignedPerson);

                assignment.DepartmentName =
                    NormalizeText(assignment.DepartmentName);

                assignment.Notes =
                    NormalizeText(assignment.Notes);

                assignment.AssignmentStatus =
                    NormalizeStatus(
                        assignment.AssignmentStatus,
                        "PENDING");

                assignment.Priority =
                    NormalizeStatus(
                        assignment.Priority,
                        "NORMAL");

                var validation =
                    await ValidateRelatedEntities(
                        assignment.EventId,
                        assignment.EventDepartmentId,
                        assignment.EventRoleId,
                        assignment.MemberId);

                if (validation != null)
                {
                    return validation;
                }
            }

            // -----------------------------------------------------
            // DUPLICATES INSIDE REQUEST
            // -----------------------------------------------------

            var requestDuplicate =
                assignments
                    .GroupBy(a => new
                    {
                        EventId = a.EventId,
                        RoleName =
                            NormalizeForComparison(
                                a.RoleName),
                        AssignedPerson =
                            NormalizeForComparison(
                                a.AssignedPerson),
                        DepartmentName =
                            NormalizeForComparison(
                                a.DepartmentName)
                    })
                    .FirstOrDefault(g => g.Count() > 1);

            if (requestDuplicate != null)
            {
                return Conflict(new
                {
                    success = false,
                    message =
                        "Duplicate assignments were detected in the request.",
                    roleName =
                        requestDuplicate.Key.RoleName,
                    assignedPerson =
                        requestDuplicate.Key.AssignedPerson,
                    departmentName =
                        requestDuplicate.Key.DepartmentName
                });
            }

            // -----------------------------------------------------
            // DATABASE DUPLICATES
            // -----------------------------------------------------

            foreach (var assignment in assignments)
            {
                var duplicate =
                    await AssignmentExistsAsync(
                        assignment.EventId,
                        assignment.RoleName,
                        assignment.AssignedPerson,
                        assignment.DepartmentName);

                if (duplicate)
                {
                    return Conflict(new
                    {
                        success = false,
                        message =
                            $"Assignment '{assignment.RoleName}' " +
                            $"for '{assignment.AssignedPerson}' " +
                            "already exists for this event."
                    });
                }
            }

            // -----------------------------------------------------
            // PREPARE AUDIT
            // -----------------------------------------------------

            foreach (var assignment in assignments)
            {
                assignment.CreatedAt = DateTime.Now;
                assignment.UpdatedAt = null;
            }

            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            _context.EventAssignments.AddRange(assignments);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RETURN
            // -----------------------------------------------------

            var ids = assignments
                .Select(a => a.EventAssignmentId)
                .ToList();

            var created = await _context.EventAssignments
                .AsNoTracking()
                .Where(a =>
                    ids.Contains(a.EventAssignmentId))
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message =
                    $"{created.Count} assignment(s) created successfully.",
                eventId,
                count = created.Count,
                assignments = created
            });
        }

        // =========================================================
        // UPDATE
        // PUT: /api/EventAssignments/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] EventAssignment model)
        {
            if (model == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Assignment data is required."
                });
            }

            var existing =
                await _context.EventAssignments
                    .FirstOrDefaultAsync(
                        a => a.EventAssignmentId == id);

            if (existing == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Event assignment not found."
                });
            }

            // -----------------------------------------------------
            // EVENT CANNOT CHANGE
            // -----------------------------------------------------

            if (model.EventId > 0 &&
                model.EventId != existing.EventId)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "The event of an existing assignment cannot be changed."
                });
            }

            // -----------------------------------------------------
            // VALIDATE RELATED ENTITIES
            // -----------------------------------------------------

            var validation =
                await ValidateRelatedEntities(
                    existing.EventId,
                    model.EventDepartmentId,
                    model.EventRoleId,
                    model.MemberId);

            if (validation != null)
            {
                return validation;
            }

            // -----------------------------------------------------
            // NORMALIZE
            // -----------------------------------------------------

            var roleName =
                NormalizeText(model.RoleName);

            var assignedPerson =
                NormalizeText(model.AssignedPerson);

            var departmentName =
                NormalizeText(model.DepartmentName);

            var assignmentStatus =
                NormalizeStatus(
                    model.AssignmentStatus,
                    "PENDING");

            var priority =
                NormalizeStatus(
                    model.Priority,
                    "NORMAL");

            var notes =
                NormalizeText(model.Notes);

            // -----------------------------------------------------
            // DUPLICATE CHECK
            // -----------------------------------------------------

            var duplicate =
                await AssignmentExistsAsync(
                    existing.EventId,
                    roleName,
                    assignedPerson,
                    departmentName,
                    id);

            if (duplicate)
            {
                return Conflict(new
                {
                    success = false,
                    message =
                        "Another identical assignment already exists for this event."
                });
            }

            // -----------------------------------------------------
            // UPDATE ONLY REAL DATABASE COLUMNS
            // -----------------------------------------------------

            existing.EventDepartmentId =
                model.EventDepartmentId;

            existing.EventRoleId =
                model.EventRoleId;

            existing.MemberId =
                model.MemberId;

            existing.AssignedPerson =
                assignedPerson;

            existing.DepartmentName =
                departmentName;

            existing.RoleName =
                roleName;

            existing.AssignmentStatus =
                assignmentStatus;

            existing.Priority =
                priority;

            existing.Notes =
                notes;

            existing.UpdatedAt =
                DateTime.Now;

            // -----------------------------------------------------
            // SAVE
            // -----------------------------------------------------

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RETURN WITHOUT INCLUDES
            // -----------------------------------------------------

            var updated =
                await GetAssignment(id);

            return Ok(new
            {
                success = true,
                message =
                    "Event assignment updated successfully.",
                assignment = updated
            });
        }

        // =========================================================
        // DELETE
        // DELETE: /api/EventAssignments/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var assignment =
                await _context.EventAssignments
                    .FirstOrDefaultAsync(
                        a => a.EventAssignmentId == id);

            if (assignment == null)
            {
                return NotFound(new
                {
                    success = false,
                    message =
                        "Event assignment not found."
                });
            }

            _context.EventAssignments.Remove(assignment);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message =
                    "Event assignment deleted successfully.",
                eventAssignmentId = id
            });
        }

        // =========================================================
        // VALIDATE RELATED ENTITIES
        // =========================================================

        private async Task<IActionResult?> ValidateRelatedEntities(
            int eventId,
            int? eventDepartmentId,
            int? eventRoleId,
            int? memberId)
        {
            // -----------------------------------------------------
            // DEPARTMENT
            // -----------------------------------------------------

            if (eventDepartmentId.HasValue)
            {
                var departmentExists =
                    await _context.EventDepartments
                        .AsNoTracking()
                        .AnyAsync(d =>
                            d.EventDepartmentId ==
                                eventDepartmentId.Value
                            &&
                            d.EventId == eventId);

                if (!departmentExists)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "The selected department does not belong to this event."
                    });
                }
            }

            // -----------------------------------------------------
            // ROLE
            // -----------------------------------------------------

            if (eventRoleId.HasValue)
            {
                var roleExists =
                    await _context.EventRoles
                        .AsNoTracking()
                        .AnyAsync(r =>
                            r.EventRoleId ==
                                eventRoleId.Value
                            &&
                            (
                                !eventDepartmentId.HasValue
                                ||
                                r.EventDepartmentId ==
                                    eventDepartmentId.Value
                            ));

                if (!roleExists)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "The selected role is invalid."
                    });
                }
            }

            // -----------------------------------------------------
            // MEMBER
            // -----------------------------------------------------

            if (memberId.HasValue)
            {
                var memberExists =
                    await _context.Members
                        .AsNoTracking()
                        .AnyAsync(m =>
                            m.MemberId == memberId.Value);

                if (!memberExists)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "The selected member does not exist."
                    });
                }
            }

            return null;
        }

        // =========================================================
        // DUPLICATE CHECK
        // =========================================================

        private async Task<bool> AssignmentExistsAsync(
            int eventId,
            string? roleName,
            string? assignedPerson,
            string? departmentName,
            int? excludeId = null)
        {
            var normalizedRole =
                NormalizeForComparison(roleName);

            var normalizedPerson =
                NormalizeForComparison(assignedPerson);

            var normalizedDepartment =
                NormalizeForComparison(departmentName);

            var query =
                _context.EventAssignments
                    .AsNoTracking()
                    .Where(a => a.EventId == eventId);

            if (excludeId.HasValue)
            {
                query = query.Where(
                    a => a.EventAssignmentId != excludeId.Value);
            }

            var existing =
                await query.ToListAsync();

            return existing.Any(a =>
                NormalizeForComparison(a.RoleName) ==
                    normalizedRole
                &&
                NormalizeForComparison(a.AssignedPerson) ==
                    normalizedPerson
                &&
                NormalizeForComparison(a.DepartmentName) ==
                    normalizedDepartment);
        }

        // =========================================================
        // GET ASSIGNMENT
        // IMPORTANT:
        // NO Include()
        // =========================================================

        private async Task<EventAssignment?> GetAssignment(int id)
        {
            return await _context.EventAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    a => a.EventAssignmentId == id);
        }

        // =========================================================
        // NORMALIZE TEXT
        // =========================================================

        private static string? NormalizeText(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim();
        }

        // =========================================================
        // NORMALIZE COMPARISON
        // =========================================================

        private static string NormalizeForComparison(
            string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }

        // =========================================================
        // NORMALIZE STATUS
        // =========================================================

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