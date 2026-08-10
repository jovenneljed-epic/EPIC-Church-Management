using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ATTENDANCE
        //
        // GET: /api/Attendance
        //
        // ADMIN / STAFF
        // Permission: Attendance -> View
        // =========================================================

        [HttpGet]
        [Permission("Attendance", "view")]
        public async Task<IActionResult> GetAttendance()
        {
            var records = await _context.Attendances
                .Include(a => a.Member)
                .Include(a => a.ChurchService)
                .OrderByDescending(a => a.AttendanceDate)
                .ToListAsync();

            return Ok(records);
        }


        // =========================================================
        // GET ATTENDANCE FOR CHURCH SERVICE
        //
        // GET:
        // /api/Attendance/church-service/{churchServiceId}
        //
        // ADMIN / STAFF
        // Permission: Attendance -> View
        // =========================================================

        [HttpGet("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "view")]
        public async Task<IActionResult> GetAttendanceForChurchService(
            int churchServiceId)
        {
            var service = await _context.ChurchServices
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    s => s.ChurchServiceId == churchServiceId);

            if (service == null)
            {
                return NotFound(new
                {
                    message =
                        "The selected church service was not found."
                });
            }


            var serviceStatus =
                string.IsNullOrWhiteSpace(service.Status)
                    ? "SCHEDULED"
                    : service.Status
                        .Trim()
                        .ToUpper();


            // =====================================================
            // CANCELLED
            // =====================================================

            if (serviceStatus == "CANCELLED")
            {
                return Ok(new
                {
                    churchServiceId =
                        service.ChurchServiceId,

                    serviceName =
                        service.ServiceName,

                    serviceDate =
                        service.ServiceDate,

                    startTime =
                        service.StartTime,

                    endTime =
                        service.EndTime,

                    location =
                        service.Location,

                    status =
                        "CANCELLED",

                    canRecordAttendance =
                        false,

                    attendanceStarted =
                        false,

                    message =
                        "This church service was cancelled. Attendance cannot be recorded.",

                    summary = new
                    {
                        total = 0,
                        present = 0,
                        late = 0,
                        early = 0,
                        absent = 0,
                        excused = 0
                    },

                    attendance =
                        new List<object>()
                });
            }


            // =====================================================
            // NOT COMPLETED
            // =====================================================

            if (serviceStatus != "COMPLETED")
            {
                return Ok(new
                {
                    churchServiceId =
                        service.ChurchServiceId,

                    serviceName =
                        service.ServiceName,

                    serviceDate =
                        service.ServiceDate,

                    startTime =
                        service.StartTime,

                    endTime =
                        service.EndTime,

                    location =
                        service.Location,

                    status =
                        serviceStatus,

                    canRecordAttendance =
                        false,

                    attendanceStarted =
                        false,

                    message =
                        "This church service has not happened yet. Attendance will become available after the service is completed.",

                    summary = new
                    {
                        total = 0,
                        present = 0,
                        late = 0,
                        early = 0,
                        absent = 0,
                        excused = 0
                    },

                    attendance =
                        new List<object>()
                });
            }


            // =====================================================
            // COMPLETED SERVICE
            // =====================================================

            var members = await _context.Members
                .AsNoTracking()
                .Where(m => m.Status == "ACTIVE")
                .OrderBy(m => m.LastName)
                .ThenBy(m => m.FirstName)
                .ToListAsync();


            var attendanceRecords =
                await _context.Attendances
                    .AsNoTracking()
                    .Where(a =>
                        a.ChurchServiceId ==
                        churchServiceId)
                    .ToListAsync();


            var result = members
                .Select(member =>
                {
                    var record =
                        attendanceRecords.FirstOrDefault(
                            a =>
                                a.MemberId ==
                                member.MemberId);

                    return new
                    {
                        memberId =
                            member.MemberId,

                        memberCode =
                            member.MemberCode,

                        firstName =
                            member.FirstName,

                        middleName =
                            member.MiddleName,

                        lastName =
                            member.LastName,

                        status =
                            NormalizeAttendanceStatus(
                                record?.Status),

                        attendanceId =
                            record?.AttendanceId,

                        attendanceDate =
                            record?.AttendanceDate
                            ?? service.ServiceDate
                    };
                })
                .ToList();


            return Ok(new
            {
                churchServiceId =
                    service.ChurchServiceId,

                serviceName =
                    service.ServiceName,

                serviceDate =
                    service.ServiceDate,

                startTime =
                    service.StartTime,

                endTime =
                    service.EndTime,

                location =
                    service.Location,

                status =
                    "COMPLETED",

                canRecordAttendance =
                    true,

                attendanceStarted =
                    true,

                message =
                    "Attendance is available for this completed church service.",

                summary = new
                {
                    total =
                        result.Count,

                    present =
                        result.Count(
                            x => x.status == "PRESENT"),

                    late =
                        result.Count(
                            x => x.status == "LATE"),

                    early =
                        result.Count(
                            x => x.status == "EARLY"),

                    absent =
                        result.Count(
                            x => x.status == "ABSENT"),

                    excused =
                        result.Count(
                            x => x.status == "EXCUSED")
                },

                attendance =
                    result
            });
        }


        // =========================================================
        // SAVE ATTENDANCE
        //
        // POST:
        // /api/Attendance/church-service/{churchServiceId}
        //
        // Permission: Attendance -> Create
        // =========================================================

        [HttpPost("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "create")]
        public async Task<IActionResult> SaveAttendance(
            int churchServiceId,
            [FromBody] AttendanceRequest request)
        {
            var service = await _context.ChurchServices
                .FirstOrDefaultAsync(
                    s =>
                        s.ChurchServiceId ==
                        churchServiceId);

            if (service == null)
            {
                return NotFound(new
                {
                    message =
                        "The selected church service was not found."
                });
            }


            var serviceStatus =
                string.IsNullOrWhiteSpace(service.Status)
                    ? "SCHEDULED"
                    : service.Status
                        .Trim()
                        .ToUpper();


            if (serviceStatus == "CANCELLED")
            {
                return BadRequest(new
                {
                    message =
                        "Attendance cannot be recorded because this church service was cancelled."
                });
            }


            if (serviceStatus != "COMPLETED")
            {
                return BadRequest(new
                {
                    message =
                        "Attendance cannot be recorded yet. Complete the church service first."
                });
            }


            if (request == null ||
                request.Attendance == null ||
                request.Attendance.Count == 0)
            {
                return BadRequest(new
                {
                    message =
                        "No attendance records were provided."
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


            var memberIds =
                request.Attendance
                    .Select(x => x.MemberId)
                    .Distinct()
                    .ToList();


            var validMemberIds =
                await _context.Members
                    .Where(m =>
                        m.Status == "ACTIVE" &&
                        memberIds.Contains(
                            m.MemberId))
                    .Select(m =>
                        m.MemberId)
                    .ToListAsync();


            var existingRecords =
                await _context.Attendances
                    .Where(a =>
                        a.ChurchServiceId ==
                            churchServiceId &&
                        memberIds.Contains(
                            a.MemberId))
                    .ToListAsync();


            if (existingRecords.Any())
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "Some attendance records already exist. Editing attendance requires the Edit permission.",

                        module =
                            "Attendance",

                        action =
                            "edit"
                    });
            }


            string recordedBy =
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";


            var savedCount = 0;


            foreach (var item in request.Attendance)
            {
                if (!validMemberIds.Contains(
                    item.MemberId))
                {
                    continue;
                }


                var status =
                    string.IsNullOrWhiteSpace(
                        item.Status)
                            ? "PRESENT"
                            : item.Status
                                .Trim()
                                .ToUpper();


                if (!allowedStatuses.Contains(
                    status))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Invalid attendance status: {status}"
                    });
                }


                var newAttendance =
                    new Attendance
                    {
                        MemberId =
                            item.MemberId,

                        ChurchServiceId =
                            churchServiceId,

                        AttendanceDate =
                            service.ServiceDate,

                        Service =
                            service.ServiceName,

                        Status =
                            status,

                        RecordedBy =
                            recordedBy,

                        RecordedDate =
                            DateTime.Now
                    };

                _context.Attendances.Add(
                    newAttendance);

                savedCount++;
            }


            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Attendance saved successfully.",

                churchServiceId =
                    churchServiceId,

                serviceName =
                    service.ServiceName,

                savedRecords =
                    savedCount
            });
        }


        // =========================================================
        // GET MY ATTENDANCE
        //
        // GET:
        // /api/Attendance/me
        //
        // MEMBER PORTAL
        //
        // IMPORTANT:
        // This does NOT require Attendance -> View permission.
        //
        // The member can only retrieve attendance belonging to
        // the memberId stored inside their JWT token.
        // =========================================================

        [HttpGet("me")]
        public async Task<IActionResult> GetMyAttendance()
        {
            // -----------------------------------------------------
            // GET MEMBER ID FROM JWT
            // -----------------------------------------------------

            var memberIdClaim =
                User.FindFirst("memberId")?.Value
                ?? User.FindFirst("MemberId")?.Value;

            if (!int.TryParse(
                memberIdClaim,
                out int memberId))
            {
                return Unauthorized(new
                {
                    message =
                        "Your account is not linked to a member record."
                });
            }


            // -----------------------------------------------------
            // VERIFY MEMBER EXISTS
            // -----------------------------------------------------

            var memberExists =
                await _context.Members
                    .AsNoTracking()
                    .AnyAsync(m =>
                        m.MemberId == memberId);

            if (!memberExists)
            {
                return NotFound(new
                {
                    message =
                        "Member record was not found."
                });
            }


            // -----------------------------------------------------
            // GET ONLY THIS MEMBER'S ATTENDANCE
            // -----------------------------------------------------

            var records =
                await _context.Attendances
                    .AsNoTracking()
                    .Include(a =>
                        a.ChurchService)
                    .Where(a =>
                        a.MemberId == memberId)
                    .OrderByDescending(a =>
                        a.AttendanceDate)
                    .Select(a => new
                    {
                        attendanceId =
                            a.AttendanceId,

                        memberId =
                            a.MemberId,

                        churchServiceId =
                            a.ChurchServiceId,

                        attendanceDate =
                            a.AttendanceDate,

                        service =
                            a.Service,

                        status =
                            NormalizeAttendanceStatus(
                                a.Status),

                        recordedBy =
                            a.RecordedBy,

                        recordedDate =
                            a.RecordedDate,

                        serviceName =
                            a.ChurchService != null
                                ? a.ChurchService.ServiceName
                                : a.Service,

                        location =
                            a.ChurchService != null
                                ? a.ChurchService.Location
                                : null,

                        startTime =
                            a.ChurchService != null
                                ? a.ChurchService.StartTime
                                : null,

                        endTime =
                            a.ChurchService != null
                                ? a.ChurchService.EndTime
                                : null
                    })
                    .ToListAsync();


            // -----------------------------------------------------
            // SUMMARY
            // -----------------------------------------------------

            var summary = new
            {
                total =
                    records.Count,

                present =
                    records.Count(x =>
                        x.status == "PRESENT"),

                late =
                    records.Count(x =>
                        x.status == "LATE"),

                early =
                    records.Count(x =>
                        x.status == "EARLY"),

                absent =
                    records.Count(x =>
                        x.status == "ABSENT"),

                excused =
                    records.Count(x =>
                        x.status == "EXCUSED")
            };


            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                memberId,

                summary,

                attendance =
                    records
            });
        }


        // =========================================================
        // DELETE ATTENDANCE
        //
        // DELETE:
        // /api/Attendance/{id}
        //
        // Permission: Attendance -> Delete
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Attendance", "delete")]
        public async Task<IActionResult> DeleteAttendance(
            int id)
        {
            var attendance =
                await _context.Attendances
                    .FirstOrDefaultAsync(
                        a =>
                            a.AttendanceId ==
                            id);

            if (attendance == null)
            {
                return NotFound(new
                {
                    message =
                        "Attendance record not found."
                });
            }


            _context.Attendances.Remove(
                attendance);


            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Attendance record deleted successfully."
            });
        }


        // =========================================================
        // NORMALIZE ATTENDANCE STATUS
        // =========================================================

        private static string NormalizeAttendanceStatus(
            string? status)
        {
            var normalized =
                string.IsNullOrWhiteSpace(status)
                    ? "PRESENT"
                    : status
                        .Trim()
                        .ToUpper();

            return normalized switch
            {
                "PRESENT" =>
                    "PRESENT",

                "LATE" =>
                    "LATE",

                "EARLY" =>
                    "EARLY",

                "ABSENT" =>
                    "ABSENT",

                "EXCUSED" =>
                    "EXCUSED",

                _ =>
                    "PRESENT"
            };
        }
    }


    // =============================================================
    // REQUEST MODELS
    // =============================================================

    public class AttendanceRequest
    {
        public List<AttendanceItem> Attendance { get; set; }
            = new();
    }


    public class AttendanceItem
    {
        public int MemberId { get; set; }

        public string Status { get; set; }
            = "PRESENT";
    }
}