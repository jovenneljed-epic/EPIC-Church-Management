
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
        // CUSTOMER / TENANT HELPER
        // =========================================================

        private int? GetCustomerId()
        {
            var customerIdClaim =
                User.FindFirst("CustomerId")?.Value
                ?? User.FindFirst("customerId")?.Value;

            return int.TryParse(customerIdClaim, out var customerId)
                ? customerId
                : null;
        }

        // =========================================================
        // GET ALL
        // GET: api/EventAssignments
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            try
            {
                var assignments = await _context.EventAssignments
                    .AsNoTracking()
                    .Where(a =>
                        a.Event != null &&
                        a.Event.CustomerId == customerId.Value)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load event assignments.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET BY EVENT
        // GET: api/EventAssignments/event/{eventId}
        // =========================================================

        [HttpGet("event/{eventId:int}")]
        public async Task<IActionResult> GetByEvent(int eventId)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            if (eventId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A valid event ID is required."
                });
            }

            try
            {
                // -------------------------------------------------
                // EVENT MUST BELONG TO CURRENT CUSTOMER
                // -------------------------------------------------

                var eventExists = await _context.Events
                    .AsNoTracking()
                    .AnyAsync(e =>
                        e.EventId == eventId &&
                        e.CustomerId == customerId.Value);

                if (!eventExists)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Event not found.",
                        eventId
                    });
                }

                // -------------------------------------------------
                // LOAD ASSIGNMENTS
                // -------------------------------------------------

                var assignments = await _context.EventAssignments
                    .AsNoTracking()
                    .Where(a =>
                        a.EventId == eventId &&
                        a.Event != null &&
                        a.Event.CustomerId == customerId.Value)
                    .OrderBy(a => a.CreatedAt)
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load event assignments.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET BY DEPARTMENT NAME
        // GET: api/EventAssignments/department-name/{departmentName}
        // =========================================================
        //
        // IMPORTANT:
        // EventAssignment does NOT have EventDepartmentId.
        //
        // Department is stored as DepartmentName text.
        //
        // =========================================================

        [HttpGet("department-name/{departmentName}")]
        public async Task<IActionResult> GetByDepartmentName(
            string departmentName)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            var normalizedDepartment =
                NormalizeForComparison(departmentName);

            if (string.IsNullOrWhiteSpace(normalizedDepartment))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Department name is required."
                });
            }

            try
            {
                var assignments = await _context.EventAssignments
                    .AsNoTracking()
                    .Where(a =>
                        a.Event != null &&
                        a.Event.CustomerId == customerId.Value)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                var result = assignments
                    .Where(a =>
                        NormalizeForComparison(
                            a.DepartmentName) ==
                        normalizedDepartment)
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message =
                        "Unable to load department assignments.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET BY MEMBER
        // GET: api/EventAssignments/member/{memberId}
        // =========================================================

        [HttpGet("member/{memberId:int}")]
        public async Task<IActionResult> GetByMember(int memberId)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            if (memberId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A valid member ID is required."
                });
            }

            try
            {
                // -------------------------------------------------
                // MEMBER MUST BELONG TO CURRENT CUSTOMER
                // -------------------------------------------------

                var memberExists = await _context.Members
                    .AsNoTracking()
                    .AnyAsync(m =>
                        m.MemberId == memberId &&
                        m.CustomerId == customerId.Value);

                if (!memberExists)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Member not found.",
                        memberId
                    });
                }

                // -------------------------------------------------
                // LOAD ASSIGNMENTS
                // -------------------------------------------------

                var assignments = await _context.EventAssignments
                    .AsNoTracking()
                    .Where(a =>
                        a.MemberId == memberId &&
                        a.Event != null &&
                        a.Event.CustomerId == customerId.Value)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load member assignments.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // GET SINGLE
        // GET: api/EventAssignments/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            if (id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A valid assignment ID is required."
                });
            }

            try
            {
                var assignment =
                    await GetAssignmentForCustomer(
                        id,
                        customerId.Value);

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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load event assignment.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // CREATE
        // POST: api/EventAssignments
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] EventAssignment model)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            if (model == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Assignment data is required."
                });
            }

            try
            {
                // -------------------------------------------------
                // EVENT REQUIRED
                // -------------------------------------------------

                if (model.EventId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "EventId is required."
                    });
                }

                // -------------------------------------------------
                // EVENT MUST BELONG TO CURRENT CUSTOMER
                // -------------------------------------------------

                var eventExists = await _context.Events
                    .AsNoTracking()
                    .AnyAsync(e =>
                        e.EventId == model.EventId &&
                        e.CustomerId == customerId.Value);

                if (!eventExists)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "The selected event does not exist or does not belong to your organization."
                    });
                }

                // -------------------------------------------------
                // NEVER TRUST FRONTEND PRIMARY KEY
                // -------------------------------------------------

                model.EventAssignmentId = 0;

                // -------------------------------------------------
                // NORMALIZE
                // -------------------------------------------------

                NormalizeAssignment(model);

                // -------------------------------------------------
                // VALIDATE MEMBER
                // -------------------------------------------------

                var memberValidation =
                    await ValidateMember(
                        model.MemberId,
                        customerId.Value);

                if (memberValidation != null)
                {
                    return memberValidation;
                }

                // -------------------------------------------------
                // DUPLICATE CHECK
                // -------------------------------------------------

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
                            "This assignment already exists for this event.",
                        eventId = model.EventId,
                        roleName = model.RoleName,
                        assignedPerson = model.AssignedPerson,
                        departmentName = model.DepartmentName
                    });
                }

                // -------------------------------------------------
                // AUDIT
                // -------------------------------------------------

                model.CreatedAt = DateTime.Now;
                model.UpdatedAt = null;

                // -------------------------------------------------
                // NEVER TRUST NAVIGATION OBJECTS FROM FRONTEND
                // -------------------------------------------------

                model.Event = null;
                model.Member = null;

                // -------------------------------------------------
                // SAVE
                // -------------------------------------------------

                _context.EventAssignments.Add(model);

                await _context.SaveChangesAsync();

                // -------------------------------------------------
                // LOAD CREATED RECORD
                // -------------------------------------------------

                var created =
                    await GetAssignmentForCustomer(
                        model.EventAssignmentId,
                        customerId.Value);

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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to create event assignment.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // CREATE BULK
        // POST: api/EventAssignments/bulk
        // =========================================================

        [HttpPost("bulk")]
        public async Task<IActionResult> CreateBulk(
            [FromBody] List<EventAssignment> assignments)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            if (assignments == null || assignments.Count == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "At least one assignment is required."
                });
            }

            try
            {
                // -------------------------------------------------
                // NULL CHECK
                // -------------------------------------------------

                if (assignments.Any(a => a == null))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Invalid assignment data was supplied."
                    });
                }

                // -------------------------------------------------
                // ALL ASSIGNMENTS MUST USE SAME EVENT
                // -------------------------------------------------

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

                // -------------------------------------------------
                // EVENT MUST BELONG TO CUSTOMER
                // -------------------------------------------------

                var eventExists = await _context.Events
                    .AsNoTracking()
                    .AnyAsync(e =>
                        e.EventId == eventId &&
                        e.CustomerId == customerId.Value);

                if (!eventExists)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "The selected event does not exist or does not belong to your organization."
                    });
                }

                // -------------------------------------------------
                // NORMALIZE + VALIDATE
                // -------------------------------------------------

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

                    // Never trust frontend primary key.
                    assignment.EventAssignmentId = 0;

                    NormalizeAssignment(assignment);

                    var memberValidation =
                        await ValidateMember(
                            assignment.MemberId,
                            customerId.Value);

                    if (memberValidation != null)
                    {
                        return memberValidation;
                    }
                }

                // -------------------------------------------------
                // DUPLICATES INSIDE REQUEST
                // -------------------------------------------------

                var requestDuplicate =
                    assignments
                        .GroupBy(a => new
                        {
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
                        .FirstOrDefault(g =>
                            g.Count() > 1);

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

                // -------------------------------------------------
                // DATABASE DUPLICATES
                // -------------------------------------------------

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

                // -------------------------------------------------
                // AUDIT + NAVIGATION CLEANUP
                // -------------------------------------------------

                foreach (var assignment in assignments)
                {
                    assignment.CreatedAt = DateTime.Now;
                    assignment.UpdatedAt = null;

                    assignment.Event = null;
                    assignment.Member = null;
                }

                // -------------------------------------------------
                // SAVE
                // -------------------------------------------------

                _context.EventAssignments.AddRange(assignments);

                await _context.SaveChangesAsync();

                // -------------------------------------------------
                // RETURN CREATED RECORDS
                // -------------------------------------------------

                var ids = assignments
                    .Select(a => a.EventAssignmentId)
                    .ToList();

                var created =
                    await _context.EventAssignments
                        .AsNoTracking()
                        .Where(a =>
                            ids.Contains(a.EventAssignmentId) &&
                            a.Event != null &&
                            a.Event.CustomerId == customerId.Value)
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to create event assignments.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // UPDATE
        // PUT: api/EventAssignments/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] EventAssignment model)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            if (id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A valid assignment ID is required."
                });
            }

            if (model == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Assignment data is required."
                });
            }

            try
            {
                // -------------------------------------------------
                // LOAD ONLY CURRENT CUSTOMER'S ASSIGNMENT
                // -------------------------------------------------

                var existing =
                    await _context.EventAssignments
                        .FirstOrDefaultAsync(a =>
                            a.EventAssignmentId == id &&
                            a.Event != null &&
                            a.Event.CustomerId ==
                                customerId.Value);

                if (existing == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Event assignment not found."
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
                            "The event of an existing assignment cannot be changed."
                    });
                }

                // -------------------------------------------------
                // VALIDATE MEMBER
                // -------------------------------------------------

                var memberValidation =
                    await ValidateMember(
                        model.MemberId,
                        customerId.Value);

                if (memberValidation != null)
                {
                    return memberValidation;
                }

                // -------------------------------------------------
                // NORMALIZE VALUES
                // -------------------------------------------------

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

                // -------------------------------------------------
                // DUPLICATE CHECK
                // -------------------------------------------------

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

                // -------------------------------------------------
                // UPDATE ALLOWED FIELDS ONLY
                // -------------------------------------------------

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

                // -------------------------------------------------
                // SAVE
                // -------------------------------------------------

                await _context.SaveChangesAsync();

                // -------------------------------------------------
                // LOAD UPDATED RECORD
                // -------------------------------------------------

                var updated =
                    await GetAssignmentForCustomer(
                        id,
                        customerId.Value);

                return Ok(new
                {
                    success = true,
                    message =
                        "Event assignment updated successfully.",
                    assignment = updated
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to update event assignment.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // DELETE
        // DELETE: api/EventAssignments/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var customerId = GetCustomerId();

            if (!customerId.HasValue)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Customer authorization is required."
                });
            }

            if (id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A valid assignment ID is required."
                });
            }

            try
            {
                var assignment =
                    await _context.EventAssignments
                        .FirstOrDefaultAsync(a =>
                            a.EventAssignmentId == id &&
                            a.Event != null &&
                            a.Event.CustomerId ==
                                customerId.Value);

                if (assignment == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Event assignment not found."
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to delete event assignment.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // VALIDATE MEMBER
        // =========================================================

        private async Task<IActionResult?> ValidateMember(
            int? memberId,
            int customerId)
        {
            // Member is optional.
            if (!memberId.HasValue)
            {
                return null;
            }

            var memberExists =
                await _context.Members
                    .AsNoTracking()
                    .AnyAsync(m =>
                        m.MemberId == memberId.Value &&
                        m.CustomerId == customerId);

            if (!memberExists)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "The selected member does not exist or does not belong to your organization."
                });
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
                    .Where(a =>
                        a.EventId == eventId);

            if (excludeId.HasValue)
            {
                query = query.Where(a =>
                    a.EventAssignmentId !=
                        excludeId.Value);
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
        // GET ASSIGNMENT FOR CUSTOMER
        // =========================================================

        private async Task<EventAssignment?>
            GetAssignmentForCustomer(
                int id,
                int customerId)
        {
            return await _context.EventAssignments
                .AsNoTracking()
                .Where(a =>
                    a.EventAssignmentId == id &&
                    a.Event != null &&
                    a.Event.CustomerId == customerId)
                .FirstOrDefaultAsync();
        }

        // =========================================================
        // NORMALIZE ASSIGNMENT
        // =========================================================

        private static void NormalizeAssignment(
            EventAssignment assignment)
        {
            assignment.RoleName =
                NormalizeText(
                    assignment.RoleName);

            assignment.AssignedPerson =
                NormalizeText(
                    assignment.AssignedPerson);

            assignment.DepartmentName =
                NormalizeText(
                    assignment.DepartmentName);

            assignment.Notes =
                NormalizeText(
                    assignment.Notes);

            assignment.AssignmentStatus =
                NormalizeStatus(
                    assignment.AssignmentStatus,
                    "PENDING");

            assignment.Priority =
                NormalizeStatus(
                    assignment.Priority,
                    "NORMAL");
        }

        // =========================================================
        // NORMALIZE TEXT
        // =========================================================

        private static string? NormalizeText(
            string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }

        // =========================================================
        // NORMALIZE COMPARISON
        // =========================================================

        private static string NormalizeForComparison(
            string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim()
                    .ToLowerInvariant();
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

