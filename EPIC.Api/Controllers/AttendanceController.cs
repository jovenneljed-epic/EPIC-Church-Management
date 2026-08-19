using EPIC.Api.Authorization;
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
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly string[] AllowedStatuses =
        {
            "PRESENT",
            "LATE",
            "EARLY",
            "ABSENT",
            "EXCUSED"
        };

        public AttendanceController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ATTENDANCE
        // GET: /api/Attendance
        // Permission: Attendance / view
        // =========================================================

        [HttpGet]
        [Permission("Attendance", "view")]
        public async Task<IActionResult> GetAttendance()
        {
            var records = await _context.Attendances
                .AsNoTracking()
                .Include(a => a.Member)
                .Include(a => a.ChurchService)
                .OrderByDescending(a => a.AttendanceDate)
                .Select(a => new
                {
                    attendanceId = a.AttendanceId,

                    memberId = a.MemberId,

                    memberCode =
                        a.Member != null
                            ? a.Member.MemberCode
                            : "",

                    memberName =
                        a.Member != null
                            ? (
                                a.Member.LastName + ", " +
                                a.Member.FirstName +
                                (
                                    string.IsNullOrWhiteSpace(
                                        a.Member.MiddleName)
                                    ? ""
                                    : " " + a.Member.MiddleName
                                )
                            )
                            : "",

                    churchServiceId =
                        a.ChurchServiceId,

                    serviceName =
                        a.ChurchService != null
                            ? a.ChurchService.ServiceName
                            : a.Service,

                    attendanceDate =
                        a.AttendanceDate,

                    status =
                        NormalizeAttendanceStatus(
                            a.Status),

                    recordedBy =
                        a.RecordedBy,

                    recordedDate =
                        a.RecordedDate
                })
                .ToListAsync();

            return Ok(records);
        }

        // =========================================================
        // GET ATTENDANCE FOR CHURCH SERVICE
        // GET: /api/Attendance/church-service/{churchServiceId}
        // Permission: Attendance / view
        // =========================================================

        [HttpGet("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "view")]
        public async Task<IActionResult>
            GetAttendanceForChurchService(
                int churchServiceId)
        {
            var service =
                await _context.ChurchServices
                    .AsNoTracking()
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
                NormalizeServiceStatus(
                    service.Status);

            // =====================================================
            // CANCELLED
            // =====================================================

            if (serviceStatus == "CANCELLED")
            {
                return Ok(
                    BuildUnavailableServiceResponse(
                        service,
                        "CANCELLED",
                        "This church service was cancelled. Attendance cannot be recorded."
                    )
                );
            }

            // =====================================================
            // NOT COMPLETED
            // =====================================================

            if (serviceStatus != "COMPLETED")
            {
                return Ok(
                    BuildUnavailableServiceResponse(
                        service,
                        serviceStatus,
                        "This church service has not happened yet. Attendance will become available after the service is completed."
                    )
                );
            }

            // =====================================================
            // GET ACTIVE MEMBERS
            // =====================================================

            var members =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.Status == "ACTIVE")
                    .OrderBy(m => m.LastName)
                    .ThenBy(m => m.FirstName)
                    .Select(m => new
                    {
                        memberId =
                            m.MemberId,

                        memberCode =
                            m.MemberCode,

                        firstName =
                            m.FirstName,

                        middleName =
                            m.MiddleName,

                        lastName =
                            m.LastName
                    })
                    .ToListAsync();

            // =====================================================
            // GET EXISTING ATTENDANCE
            // =====================================================

            var attendanceRecords =
                await _context.Attendances
                    .AsNoTracking()
                    .Where(a =>
                        a.ChurchServiceId ==
                        churchServiceId)
                    .ToListAsync();

            // =====================================================
            // COMBINE MEMBERS + ATTENDANCE
            // =====================================================

            var attendance =
                members.Select(member =>
                {
                    var record =
                        attendanceRecords
                            .FirstOrDefault(
                                a =>
                                    a.MemberId ==
                                    member.memberId);

                    return new
                    {
                        memberId =
                            member.memberId,

                        memberCode =
                            member.memberCode,

                        firstName =
                            member.firstName,

                        middleName =
                            member.middleName,

                        lastName =
                            member.lastName,

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

            // =====================================================
            // SUMMARY
            // =====================================================

            var summary =
                BuildAttendanceSummary(
                    attendance);

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

                summary,

                attendance
            });
        }

        // =========================================================
        // SAVE / UPDATE ATTENDANCE
        //
        // POST:
        // /api/Attendance/church-service/{churchServiceId}
        //
        // Permission: Attendance / create
        // =========================================================

        [HttpPost("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "create")]
        public async Task<IActionResult>
            SaveAttendance(
                int churchServiceId,
                [FromBody] AttendanceRequest request)
        {
            // =====================================================
            // VALIDATE REQUEST
            // =====================================================

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

            // =====================================================
            // GET SERVICE
            // =====================================================

            var service =
                await _context.ChurchServices
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

            // =====================================================
            // VALIDATE SERVICE
            // =====================================================

            var serviceStatus =
                NormalizeServiceStatus(
                    service.Status);

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

            // =====================================================
            // VALIDATE DUPLICATE MEMBER IDS
            // =====================================================

            var duplicateMemberIds =
                request.Attendance
                    .GroupBy(x => x.MemberId)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToList();

            if (duplicateMemberIds.Count > 0)
            {
                return BadRequest(new
                {
                    message =
                        "Duplicate member attendance records were submitted.",

                    memberIds =
                        duplicateMemberIds
                });
            }

            // =====================================================
            // VALIDATE STATUSES FIRST
            // =====================================================

            foreach (var item in request.Attendance)
            {
                var status =
                    NormalizeAttendanceStatus(
                        item.Status);

                if (!AllowedStatuses.Contains(status))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Invalid attendance status: {item.Status}",

                        allowedStatuses =
                            AllowedStatuses
                    });
                }
            }

            // =====================================================
            // GET MEMBER IDS
            // =====================================================

            var memberIds =
                request.Attendance
                    .Select(x => x.MemberId)
                    .Distinct()
                    .ToList();

            // =====================================================
            // VALID ACTIVE MEMBERS
            // =====================================================

            var validMemberIds =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.Status == "ACTIVE" &&
                        memberIds.Contains(
                            m.MemberId))
                    .Select(m =>
                        m.MemberId)
                    .ToListAsync();

            var invalidMemberIds =
                memberIds
                    .Except(validMemberIds)
                    .ToList();

            if (invalidMemberIds.Count > 0)
            {
                return BadRequest(new
                {
                    message =
                        "One or more members are invalid or inactive.",

                    memberIds =
                        invalidMemberIds
                });
            }

            // =====================================================
            // EXISTING RECORDS
            // =====================================================

            var existingRecords =
                await _context.Attendances
                    .Where(a =>
                        a.ChurchServiceId ==
                            churchServiceId &&
                        memberIds.Contains(
                            a.MemberId))
                    .ToListAsync();

            // =====================================================
            // CREATE OR UPDATE
            //
            // If a record exists:
            // require Attendance / edit permission.
            // =====================================================

            var canEdit =
                User.HasClaim(
                    "permission",
                    "Attendance:edit");

            // Also support authorization implementations
            // that expose permissions in another claim format.

            if (existingRecords.Count > 0 &&
                !canEdit)
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

            var recordedBy =
                GetCurrentUserName();

            var existingLookup =
                existingRecords.ToDictionary(
                    x => x.MemberId);

            var savedCount = 0;
            var updatedCount = 0;

            // =====================================================
            // PROCESS ATTENDANCE
            // =====================================================

            foreach (var item in request.Attendance)
            {
                var status =
                    NormalizeAttendanceStatus(
                        item.Status);

                if (existingLookup.TryGetValue(
                    item.MemberId,
                    out var existing))
                {
                    existing.Status =
                        status;

                    existing.AttendanceDate =
                        service.ServiceDate;

                    existing.Service =
                        service.ServiceName;

                    existing.RecordedBy =
                        recordedBy;

                    existing.RecordedDate =
                        DateTime.Now;

                    updatedCount++;
                }
                else
                {
                    var attendance =
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
                        attendance);

                    savedCount++;
                }
            }

            await _context.SaveChangesAsync();

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "Attendance saved successfully.",

                churchServiceId,

                serviceName =
                    service.ServiceName,

                savedRecords =
                    savedCount,

                updatedRecords =
                    updatedCount,

                totalProcessed =
                    savedCount +
                    updatedCount
            });
        }

        // =========================================================
        // GET MY ATTENDANCE
        //
        // GET: /api/Attendance/me
        //
        // MEMBER PORTAL
        //
        // Does NOT require Attendance / view.
        // =========================================================

        [HttpGet("me")]
        public async Task<IActionResult>
            GetMyAttendance()
        {
            var memberIdClaim =
                User.FindFirst("memberId")?.Value
                ?? User.FindFirst("MemberId")?.Value
                ?? User.FindFirst("member_id")?.Value;

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

            // =====================================================
            // VERIFY MEMBER
            // =====================================================

            var member =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.MemberId ==
                        memberId)
                    .Select(m => new
                    {
                        memberId =
                            m.MemberId,

                        memberCode =
                            m.MemberCode,

                        firstName =
                            m.FirstName,

                        middleName =
                            m.MiddleName,

                        lastName =
                            m.LastName
                    })
                    .FirstOrDefaultAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "Member record was not found."
                });
            }

            // =====================================================
            // GET ATTENDANCE
            // =====================================================

            var records =
                await _context.Attendances
                    .AsNoTracking()
                    .Where(a =>
                        a.MemberId ==
                        memberId)
                    .OrderByDescending(
                        a =>
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

            // =====================================================
            // SUMMARY
            // =====================================================

            var summary =
                BuildAttendanceSummary(
                    records);

            return Ok(new
            {
                member,

                summary,

                attendance =
                    records
            });
        }

        // =========================================================
        // DELETE ATTENDANCE
        // DELETE: /api/Attendance/{id}
        // Permission: Attendance / delete
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Attendance", "delete")]
        public async Task<IActionResult>
            DeleteAttendance(int id)
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
                    "Attendance record deleted successfully.",

                attendanceId =
                    id
            });
        }

        // =========================================================
        // NORMALIZE ATTENDANCE STATUS
        // =========================================================

        private static string
            NormalizeAttendanceStatus(
                string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return "PRESENT";
            }

            var normalized =
                status.Trim().ToUpperInvariant();

            return normalized switch
            {
                "PRESENT" => "PRESENT",
                "LATE" => "LATE",
                "EARLY" => "EARLY",
                "ABSENT" => "ABSENT",
                "EXCUSED" => "EXCUSED",

                _ => normalized
            };
        }

        // =========================================================
        // NORMALIZE SERVICE STATUS
        // =========================================================

        private static string
            NormalizeServiceStatus(
                string? status)
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
        // CURRENT USER
        // =========================================================

        private string GetCurrentUserName()
        {
            return
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("userName")?.Value
                ?? User.FindFirst("username")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";
        }

        // =========================================================
        // BUILD ATTENDANCE SUMMARY
        // =========================================================

        private static object
            BuildAttendanceSummary<T>(
                IEnumerable<T> records)
        {
            var list =
                records.ToList();

            return new
            {
                total =
                    list.Count,

                present =
                    list.Count(x =>
                        GetStatus(x) ==
                        "PRESENT"),

                late =
                    list.Count(x =>
                        GetStatus(x) ==
                        "LATE"),

                early =
                    list.Count(x =>
                        GetStatus(x) ==
                        "EARLY"),

                absent =
                    list.Count(x =>
                        GetStatus(x) ==
                        "ABSENT"),

                excused =
                    list.Count(x =>
                        GetStatus(x) ==
                        "EXCUSED")
            };
        }

        // =========================================================
        // GET STATUS FROM OBJECT
        // =========================================================

        private static string GetStatus<T>(
            T record)
        {
            var property =
                typeof(T).GetProperty(
                    "status");

            if (property == null)
            {
                return "PRESENT";
            }

            var value =
                property.GetValue(record)
                ?.ToString();

            return NormalizeAttendanceStatus(
                value);
        }

        // =========================================================
        // UNAVAILABLE SERVICE RESPONSE
        // =========================================================

        private static object
            BuildUnavailableServiceResponse(
                ChurchService service,
                string status,
                string message)
        {
            return new
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

                status,

                canRecordAttendance =
                    false,

                attendanceStarted =
                    false,

                message,

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