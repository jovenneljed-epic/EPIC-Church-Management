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
    public class VisitorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VisitorController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL VISITORS
        //
        // GET /api/Visitor
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetVisitors()
        {
            var visitors = await _context.Visitors
                .AsNoTracking()
                .OrderByDescending(v => v.CreatedDate)
                .Select(v => new
                {
                    visitorId = v.VisitorId,
                    visitorCode = v.VisitorCode,

                    firstName = v.FirstName,
                    middleName = v.MiddleName,
                    lastName = v.LastName,

                    fullName =
                        v.LastName + ", " +
                        v.FirstName +
                        (string.IsNullOrWhiteSpace(v.MiddleName)
                            ? ""
                            : " " + v.MiddleName),

                    gender = v.Gender,
                    birthDate = v.BirthDate,

                    contactNumber = v.ContactNumber,
                    address = v.Address,

                    invitedBy = v.InvitedBy,
                    ministry = v.Ministry,

                    firstVisitDate = v.FirstVisitDate,
                    visitCount = v.VisitCount,

                    followUpStatus = v.FollowUpStatus,
                    status = v.Status,

                    notes = v.Notes,

                    isConvertedToMember =
                        v.IsConvertedToMember,

                    convertedMemberId =
                        v.ConvertedMemberId,

                    conversionDate =
                        v.ConversionDate,

                    createdDate =
                        v.CreatedDate,

                    updatedDate =
                        v.UpdatedDate
                })
                .ToListAsync();

            return Ok(visitors);
        }


        // =========================================================
        // GET VISITOR BY ID
        //
        // GET /api/Visitor/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetVisitor(int id)
        {
            var visitor = await _context.Visitors
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message = "Visitor not found."
                });
            }

            return Ok(visitor);
        }


        // =========================================================
        // GET VISITOR ATTENDANCE HISTORY
        //
        // GET /api/Visitor/{id}/attendance
        // =========================================================

        [HttpGet("{id:int}/attendance")]
        public async Task<IActionResult> GetVisitorAttendance(
            int id)
        {
            var visitor = await _context.Visitors
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message = "Visitor not found."
                });
            }

            var attendance =
                await _context.VisitorAttendances
                    .AsNoTracking()
                    .Include(a => a.ChurchService)
                    .Where(a => a.VisitorId == id)
                    .OrderByDescending(
                        a => a.AttendanceDate)
                    .Select(a => new
                    {
                        visitorAttendanceId =
                            a.VisitorAttendanceId,

                        visitorId =
                            a.VisitorId,

                        churchServiceId =
                            a.ChurchServiceId,

                        serviceName =
                            a.ChurchService != null
                                ? a.ChurchService.ServiceName
                                : "",

                        attendanceDate =
                            a.AttendanceDate,

                        status =
                            a.Status,

                        recordedBy =
                            a.RecordedBy,

                        recordedDate =
                            a.RecordedDate
                    })
                    .ToListAsync();

            return Ok(new
            {
                visitor = new
                {
                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode,

                    fullName =
                        visitor.LastName + ", " +
                        visitor.FirstName +
                        (string.IsNullOrWhiteSpace(
                            visitor.MiddleName)
                            ? ""
                            : " " + visitor.MiddleName),

                    visitCount =
                        visitor.VisitCount,

                    followUpStatus =
                        visitor.FollowUpStatus,

                    isConvertedToMember =
                        visitor.IsConvertedToMember
                },

                attendance
            });
        }


        // =========================================================
        // CREATE VISITOR
        //
        // POST /api/Visitor
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateVisitor(
            [FromBody] VisitorRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Visitor information is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                request.FirstName))
            {
                return BadRequest(new
                {
                    message =
                        "First name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                request.LastName))
            {
                return BadRequest(new
                {
                    message =
                        "Last name is required."
                });
            }

            var visitorCode =
                await GenerateVisitorCode();

            var now = DateTime.Now;

            var visitor = new Visitor
            {
                VisitorCode =
                    visitorCode,

                FirstName =
                    request.FirstName.Trim(),

                MiddleName =
                    request.MiddleName?.Trim() ?? "",

                LastName =
                    request.LastName.Trim(),

                Gender =
                    request.Gender?.Trim() ?? "",

                BirthDate =
                    request.BirthDate,

                ContactNumber =
                    request.ContactNumber?.Trim() ?? "",

                Address =
                    request.Address?.Trim() ?? "",

                InvitedBy =
                    request.InvitedBy?.Trim() ?? "",

                Ministry =
                    request.Ministry?.Trim() ?? "",

                FirstVisitDate =
                    request.FirstVisitDate
                    ?? DateTime.Today,

                VisitCount =
                    0,

                FollowUpStatus =
                    "NEW",

                Status =
                    "ACTIVE",

                Notes =
                    request.Notes?.Trim() ?? "",

                IsConvertedToMember =
                    false,

                ConvertedMemberId =
                    null,

                ConversionDate =
                    null,

                CreatedDate =
                    now,

                UpdatedDate =
                    null
            };

            _context.Visitors.Add(visitor);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetVisitor),
                new
                {
                    id = visitor.VisitorId
                },
                new
                {
                    message =
                        "Visitor created successfully.",

                    visitorId =
                        visitor.VisitorId,

                    visitorCode =
                        visitor.VisitorCode
                });
        }


        // =========================================================
        // UPDATE VISITOR
        //
        // PUT /api/Visitor/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateVisitor(
            int id,
            [FromBody] VisitorRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Visitor information is required."
                });
            }

            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "Visitor not found."
                });
            }

            if (string.IsNullOrWhiteSpace(
                request.FirstName))
            {
                return BadRequest(new
                {
                    message =
                        "First name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                request.LastName))
            {
                return BadRequest(new
                {
                    message =
                        "Last name is required."
                });
            }

            visitor.FirstName =
                request.FirstName.Trim();

            visitor.MiddleName =
                request.MiddleName?.Trim() ?? "";

            visitor.LastName =
                request.LastName.Trim();

            visitor.Gender =
                request.Gender?.Trim() ?? "";

            visitor.BirthDate =
                request.BirthDate;

            visitor.ContactNumber =
                request.ContactNumber?.Trim() ?? "";

            visitor.Address =
                request.Address?.Trim() ?? "";

            visitor.InvitedBy =
                request.InvitedBy?.Trim() ?? "";

            visitor.Ministry =
                request.Ministry?.Trim() ?? "";

            visitor.FirstVisitDate =
                request.FirstVisitDate
                ?? visitor.FirstVisitDate;

            visitor.Notes =
                request.Notes?.Trim() ?? "";

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Visitor updated successfully."
            });
        }


        // =========================================================
        // UPDATE FOLLOW-UP STATUS
        //
        // PATCH /api/Visitor/{id}/follow-up
        // =========================================================

        [HttpPatch("{id:int}/follow-up")]
        public async Task<IActionResult> UpdateFollowUpStatus(
            int id,
            [FromBody] FollowUpRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Follow-up information is required."
                });
            }

            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "Visitor not found."
                });
            }

            var allowedStatuses =
                new[]
                {
                    "NEW",
                    "CONTACTED",
                    "FOLLOW-UP",
                    "CONNECTED",
                    "CONVERTED"
                };

            var status =
                request.Status?
                    .Trim()
                    .ToUpper();

            if (string.IsNullOrWhiteSpace(status) ||
                !allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid follow-up status.",

                    allowedStatuses
                });
            }

            visitor.FollowUpStatus =
                status;

            visitor.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Follow-up status updated successfully.",

                visitorId =
                    visitor.VisitorId,

                followUpStatus =
                    visitor.FollowUpStatus
            });
        }


        // =========================================================
        // RECORD VISITOR ATTENDANCE
        //
        // POST /api/Visitor/{id}/attendance
        // =========================================================

        [HttpPost("{id:int}/attendance")]
        public async Task<IActionResult> RecordAttendance(
            int id,
            [FromBody] VisitorAttendanceRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Attendance information is required."
                });
            }

            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "Visitor not found."
                });
            }

            var service =
                await _context.ChurchServices
                    .FirstOrDefaultAsync(
                        s =>
                            s.ChurchServiceId ==
                            request.ChurchServiceId);

            if (service == null)
            {
                return NotFound(new
                {
                    message =
                        "Church service not found."
                });
            }

            var serviceStatus =
                string.IsNullOrWhiteSpace(
                    service.Status)
                    ? "SCHEDULED"
                    : service.Status
                        .Trim()
                        .ToUpper();

            if (serviceStatus != "COMPLETED")
            {
                return BadRequest(new
                {
                    message =
                        "Visitor attendance can only be recorded for completed church services."
                });
            }

            var existing =
                await _context.VisitorAttendances
                    .FirstOrDefaultAsync(
                        a =>
                            a.VisitorId == id &&
                            a.ChurchServiceId ==
                                request.ChurchServiceId);

            if (existing != null)
            {
                return Conflict(new
                {
                    message =
                        "Attendance has already been recorded for this visitor for this church service."
                });
            }

            var allowedStatuses =
                new[]
                {
                    "PRESENT",
                    "LATE",
                    "EARLY",
                    "ABSENT",
                    "EXCUSED"
                };

            var status =
                string.IsNullOrWhiteSpace(
                    request.Status)
                    ? "PRESENT"
                    : request.Status
                        .Trim()
                        .ToUpper();

            if (!allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        $"Invalid attendance status: {status}"
                });
            }

            var recordedBy =
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";

            var attendance =
                new VisitorAttendance
                {
                    VisitorId =
                        id,

                    ChurchServiceId =
                        request.ChurchServiceId,

                    AttendanceDate =
                        service.ServiceDate,

                    Status =
                        status,

                    RecordedBy =
                        recordedBy,

                    RecordedDate =
                        DateTime.Now
                };

            _context.VisitorAttendances.Add(
                attendance);

            visitor.VisitCount =
                await _context.VisitorAttendances
                    .CountAsync(
                        a => a.VisitorId == id) + 1;

            if (visitor.VisitCount == 1)
            {
                visitor.FirstVisitDate =
                    service.ServiceDate;
            }

            visitor.UpdatedDate =
                DateTime.Now;

            if (visitor.FollowUpStatus == "NEW")
            {
                visitor.FollowUpStatus =
                    "CONTACTED";
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Visitor attendance recorded successfully.",

                visitorId =
                    visitor.VisitorId,

                visitorCode =
                    visitor.VisitorCode,

                visitCount =
                    visitor.VisitCount,

                attendanceId =
                    attendance.VisitorAttendanceId,

                status =
                    attendance.Status
            });
        }


        // =========================================================
        // DELETE VISITOR
        //
        // DELETE /api/Visitor/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteVisitor(
            int id)
        {
            var visitor =
                await _context.Visitors
                    .FirstOrDefaultAsync(
                        v => v.VisitorId == id);

            if (visitor == null)
            {
                return NotFound(new
                {
                    message =
                        "Visitor not found."
                });
            }

            _context.Visitors.Remove(visitor);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Visitor deleted successfully."
            });
        }


        // =========================================================
        // VISITOR DASHBOARD SUMMARY
        //
        // GET /api/Visitor/dashboard
        // =========================================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var total =
                await _context.Visitors
                    .CountAsync();

            var active =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.Status == "ACTIVE");

            var newVisitors =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.FollowUpStatus ==
                            "NEW");

            var contacted =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.FollowUpStatus ==
                            "CONTACTED");

            var followUps =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.FollowUpStatus ==
                            "FOLLOW-UP");

            var connected =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.FollowUpStatus ==
                            "CONNECTED");

            var converted =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.IsConvertedToMember);

            var firstTimeVisitors =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.VisitCount <= 1);

            var returningVisitors =
                await _context.Visitors
                    .CountAsync(
                        v =>
                            v.VisitCount > 1);

            return Ok(new
            {
                totalVisitors =
                    total,

                activeVisitors =
                    active,

                newVisitors =
                    newVisitors,

                contactedVisitors =
                    contacted,

                followUpVisitors =
                    followUps,

                connectedVisitors =
                    connected,

                convertedMembers =
                    converted,

                firstTimeVisitors =
                    firstTimeVisitors,

                returningVisitors =
                    returningVisitors
            });
        }


        // =========================================================
        // GENERATE VISITOR CODE
        // =========================================================

        private async Task<string> GenerateVisitorCode()
        {
            var year =
                DateTime.Now.Year;

            var prefix =
                $"VIS-{year}-";

            var lastCode =
                await _context.Visitors
                    .Where(v =>
                        v.VisitorCode.StartsWith(prefix))
                    .OrderByDescending(
                        v => v.VisitorId)
                    .Select(v => v.VisitorCode)
                    .FirstOrDefaultAsync();

            var nextNumber = 1;

            if (!string.IsNullOrWhiteSpace(lastCode))
            {
                var numberPart =
                    lastCode.Replace(prefix, "");

                if (int.TryParse(
                    numberPart,
                    out var lastNumber))
                {
                    nextNumber =
                        lastNumber + 1;
                }
            }

            return $"{prefix}{nextNumber:D4}";
        }
    }


    // =============================================================
    // REQUEST MODELS
    // =============================================================

    public class VisitorRequest
    {
        public string FirstName { get; set; } = "";

        public string MiddleName { get; set; } = "";

        public string LastName { get; set; } = "";

        public string Gender { get; set; } = "";

        public DateTime? BirthDate { get; set; }

        public string ContactNumber { get; set; } = "";

        public string Address { get; set; } = "";

        public string InvitedBy { get; set; } = "";

        public string Ministry { get; set; } = "";

        public DateTime? FirstVisitDate { get; set; }

        public string Notes { get; set; } = "";
    }


    public class FollowUpRequest
    {
        public string Status { get; set; } = "";
    }


    public class VisitorAttendanceRequest
    {
        public int ChurchServiceId { get; set; }

        public string Status { get; set; } = "PRESENT";
    }
}