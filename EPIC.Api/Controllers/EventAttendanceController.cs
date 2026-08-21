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
    public class EventAttendanceController : ControllerBase
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

        public EventAttendanceController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET EVENT ATTENDANCE
        // GET: api/EventAttendance/event/{eventId}
        // =========================================================

        [HttpGet("event/{eventId:int}")]
        [Permission("Attendance", "view")]
        public async Task<IActionResult> GetEventAttendance(
            int eventId)
        {
            var churchEvent =
                await _context.Events
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        e => e.EventId == eventId);

            if (churchEvent == null)
            {
                return NotFound(new
                {
                    message = "The selected event was not found."
                });
            }

            var status =
                NormalizeStatus(churchEvent.Status);

            if (status == "CANCELLED")
            {
                return Ok(new
                {
                    eventId = churchEvent.EventId,
                    title = churchEvent.Title,
                    eventType = churchEvent.EventType,
                    eventDate = churchEvent.EventDate,
                    startTime = churchEvent.StartTime,
                    endTime = churchEvent.EndTime,
                    venue = churchEvent.Venue,
                    speaker = churchEvent.Speaker,
                    ministry = churchEvent.Ministry,
                    status = status,
                    canRecordAttendance = false,
                    message =
                        "This event was cancelled. Attendance cannot be recorded.",
                    summary = EmptySummary(),
                    attendance = new List<object>()
                });
            }

            var members =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.Status == "ACTIVE")
                    .OrderBy(m => m.LastName)
                    .ThenBy(m => m.FirstName)
                    .Select(m => new
                    {
                        memberId = m.MemberId,
                        memberCode = m.MemberCode,
                        firstName = m.FirstName,
                        middleName = m.MiddleName,
                        lastName = m.LastName
                    })
                    .ToListAsync();

            var records =
                await _context.Attendances
                    .AsNoTracking()
                    .Where(a =>
                        a.EventId == eventId)
                    .ToListAsync();

            var attendance =
                members.Select(member =>
                {
                    var record =
                        records.FirstOrDefault(
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
                            NormalizeStatus(
                                record?.Status),

                        attendanceId =
                            record?.AttendanceId,

                        attendanceDate =
                            record?.AttendanceDate
                            ?? churchEvent.EventDate
                    };
                })
                .ToList();

            return Ok(new
            {
                eventId =
                    churchEvent.EventId,

                title =
                    churchEvent.Title,

                eventType =
                    churchEvent.EventType,

                eventDate =
                    churchEvent.EventDate,

                startTime =
                    churchEvent.StartTime,

                endTime =
                    churchEvent.EndTime,

                venue =
                    churchEvent.Venue,

                speaker =
                    churchEvent.Speaker,

                ministry =
                    churchEvent.Ministry,

                status =
                    status,

                canRecordAttendance =
                    status != "CANCELLED",

                message =
                    "Event attendance is available.",

                summary =
                    BuildSummary(attendance),

                attendance
            });
        }


        // =========================================================
        // SAVE EVENT ATTENDANCE
        // POST:
        // api/EventAttendance/event/{eventId}
        // =========================================================

        [HttpPost("event/{eventId:int}")]
        [Permission("Attendance", "create")]
        public async Task<IActionResult> SaveEventAttendance(
            int eventId,
            [FromBody] EventAttendanceRequest request)
        {
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

            var churchEvent =
                await _context.Events
                    .FirstOrDefaultAsync(
                        e => e.EventId == eventId);

            if (churchEvent == null)
            {
                return NotFound(new
                {
                    message =
                        "The selected event was not found."
                });
            }

            var eventStatus =
                NormalizeStatus(
                    churchEvent.Status);

            if (eventStatus == "CANCELLED")
            {
                return BadRequest(new
                {
                    message =
                        "Attendance cannot be recorded because this event was cancelled."
                });
            }

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

            foreach (var item in request.Attendance)
            {
                var normalized =
                    NormalizeStatus(item.Status);

                if (!AllowedStatuses.Contains(
                    normalized))
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

            var memberIds =
                request.Attendance
                    .Select(x => x.MemberId)
                    .Distinct()
                    .ToList();

            var validMemberIds =
                await _context.Members
                    .AsNoTracking()
                    .Where(m =>
                        m.Status == "ACTIVE" &&
                        memberIds.Contains(
                            m.MemberId))
                    .Select(m => m.MemberId)
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

            var existingRecords =
                await _context.Attendances
                    .Where(a =>
                        a.EventId == eventId &&
                        memberIds.Contains(
                            a.MemberId))
                    .ToListAsync();

            var canEdit =
                User.HasClaim(
                    "permission",
                    "Attendance:edit");

            if (existingRecords.Count > 0 &&
                !canEdit)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "Some attendance records already exist. Editing attendance requires the Edit permission."
                    });
            }

            var recordedBy =
                GetCurrentUserName();

            var existingLookup =
                existingRecords.ToDictionary(
                    x => x.MemberId);

            var savedCount = 0;
            var updatedCount = 0;

            foreach (var item in request.Attendance)
            {
                var status =
                    NormalizeStatus(
                        item.Status);

                if (existingLookup.TryGetValue(
                    item.MemberId,
                    out var existing))
                {
                    existing.Status =
                        status;

                    existing.AttendanceDate =
                        churchEvent.EventDate;

                    existing.Service =
                        churchEvent.Title;

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

                            EventId =
                                eventId,

                            AttendanceDate =
                                churchEvent.EventDate,

                            Service =
                                churchEvent.Title,

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

            return Ok(new
            {
                message =
                    "Event attendance saved successfully.",

                eventId,

                eventName =
                    churchEvent.Title,

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
        // HELPERS
        // =========================================================

        private static string NormalizeStatus(
            string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return "PRESENT";

            return status
                .Trim()
                .ToUpperInvariant();
        }

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

        private static object BuildSummary<T>(
            IEnumerable<T> records)
        {
            var list =
                records.ToList();

            return new
            {
                total = list.Count,

                present =
                    list.Count(x =>
                        GetStatus(x) == "PRESENT"),

                late =
                    list.Count(x =>
                        GetStatus(x) == "LATE"),

                early =
                    list.Count(x =>
                        GetStatus(x) == "EARLY"),

                absent =
                    list.Count(x =>
                        GetStatus(x) == "ABSENT"),

                excused =
                    list.Count(x =>
                        GetStatus(x) == "EXCUSED")
            };
        }

        private static string GetStatus<T>(
            T record)
        {
            var property =
                typeof(T).GetProperty("status");

            if (property == null)
                return "PRESENT";

            return NormalizeStatus(
                property
                    .GetValue(record)?
                    .ToString());
        }

        private static object EmptySummary()
        {
            return new
            {
                total = 0,
                present = 0,
                late = 0,
                early = 0,
                absent = 0,
                excused = 0
            };
        }
    }

    // =============================================================
    // REQUEST MODELS
    // =============================================================

    public class EventAttendanceRequest
    {
        public List<EventAttendanceItem> Attendance { get; set; }
            = new();
    }

    public class EventAttendanceItem
    {
        public int MemberId { get; set; }

        public string Status { get; set; }
            = "PRESENT";
    }
}