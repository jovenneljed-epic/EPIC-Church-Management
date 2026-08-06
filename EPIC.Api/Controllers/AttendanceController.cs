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
        // GET: /api/Attendance
        //
        // Permission:
        // Attendance -> View
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
        // Permission:
        // Attendance -> View
        // =========================================================

        [HttpGet("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "view")]
        public async Task<IActionResult> GetAttendanceForChurchService(
            int churchServiceId)
        {
            // -----------------------------------------------------
            // FIND CHURCH SERVICE
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // NORMALIZE SERVICE STATUS
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // LOAD EXISTING ATTENDANCE
            // -----------------------------------------------------

            var attendanceRecords =
                await _context.Attendances
                    .AsNoTracking()
                    .Where(a =>
                        a.ChurchServiceId ==
                        churchServiceId)
                    .ToListAsync();


            // -----------------------------------------------------
            // BUILD RESULT
            // -----------------------------------------------------

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


            // =====================================================
            // RETURN COMPLETED SERVICE
            // =====================================================

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
        // Permission:
        // Attendance -> Create
        //
        // IMPORTANT:
        // This endpoint creates new records only.
        // Editing existing records will be handled separately
        // with Attendance -> Edit.
        // =========================================================

        [HttpPost("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "create")]
        public async Task<IActionResult> SaveAttendance(
            int churchServiceId,
            [FromBody] AttendanceRequest request)
        {
            // -----------------------------------------------------
            // FIND SERVICE
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // SERVICE STATUS
            // -----------------------------------------------------

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
                return BadRequest(new
                {
                    message =
                        "Attendance cannot be recorded because this church service was cancelled."
                });
            }


            // =====================================================
            // NOT COMPLETED
            // =====================================================

            if (serviceStatus != "COMPLETED")
            {
                return BadRequest(new
                {
                    message =
                        "Attendance cannot be recorded yet. Complete the church service first."
                });
            }


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
            // ALLOWED STATUSES
            // =====================================================

            var allowedStatuses =
                new[]
                {
                    "PRESENT",
                    "LATE",
                    "EARLY",
                    "ABSENT",
                    "EXCUSED"
                };


            // =====================================================
            // MEMBER IDS
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
                    .Where(m =>
                        m.Status == "ACTIVE" &&
                        memberIds.Contains(
                            m.MemberId))
                    .Select(m =>
                        m.MemberId)
                    .ToListAsync();


            // =====================================================
            // CHECK EXISTING RECORDS
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
            // IMPORTANT PERMISSION RULE
            //
            // This endpoint has CREATE permission only.
            //
            // If an attendance record already exists,
            // do NOT allow this endpoint to update it.
            //
            // Editing will be handled through the EDIT endpoint.
            // =====================================================

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


            // =====================================================
            // RECORDED BY
            // =====================================================

            string recordedBy =
                User.Identity?.Name
                ?? User.FindFirst("name")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "SYSTEM";


            var savedCount = 0;


            // =====================================================
            // CREATE EACH MEMBER ATTENDANCE
            // =====================================================

            foreach (var item in request.Attendance)
            {
                // -------------------------------------------------
                // IGNORE INVALID MEMBERS
                // -------------------------------------------------

                if (!validMemberIds.Contains(
                    item.MemberId))
                {
                    continue;
                }


                // -------------------------------------------------
                // NORMALIZE STATUS
                // -------------------------------------------------

                var status =
                    string.IsNullOrWhiteSpace(
                        item.Status)
                            ? "PRESENT"
                            : item.Status
                                .Trim()
                                .ToUpper();


                // -------------------------------------------------
                // VALIDATE STATUS
                // -------------------------------------------------

                if (!allowedStatuses.Contains(
                    status))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Invalid attendance status: {status}"
                    });
                }


                // =================================================
                // CREATE NEW RECORD
                // =================================================

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


            // =====================================================
            // SAVE
            // =====================================================

            await _context.SaveChangesAsync();


            // =====================================================
            // RESPONSE
            // =====================================================

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
        // DELETE ATTENDANCE
        //
        // DELETE:
        // /api/Attendance/{id}
        //
        // Permission:
        // Attendance -> Delete
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