using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Core.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Security.Claims;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IPermissionService _permissionService;

        private static readonly HashSet<string> AllowedStatuses =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "PRESENT",
                "LATE",
                "EARLY",
                "ABSENT",
                "EXCUSED"
            };

        public AttendanceController(
            ApplicationDbContext context,
            IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
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
            var query = GetTenantAttendanceQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var records = await query
                .AsNoTracking()
                .Include(a => a.Member)
                .Include(a => a.ChurchService)
                .OrderByDescending(a => a.AttendanceDate)
                .ThenByDescending(a => a.AttendanceId)
                .ToListAsync();

            var result = records.Select(a => new
            {
                attendanceId = a.AttendanceId,

                memberId = a.MemberId,

                memberCode = a.Member?.MemberCode ?? string.Empty,

                memberName = a.Member != null
                    ? BuildMemberName(a.Member)
                    : string.Empty,

                churchServiceId = a.ChurchServiceId,

                eventId = a.EventId,

                serviceName = a.ChurchService != null
                    ? a.ChurchService.ServiceName
                    : a.Service,

                attendanceDate = a.AttendanceDate,

                status = NormalizeAttendanceStatus(a.Status),

                recordedBy = a.RecordedBy,

                recordedDate = a.RecordedDate
            }).ToList();

            return Ok(result);
        }

        // =========================================================
        // GET ATTENDANCE FOR CHURCH SERVICE
        // GET: /api/Attendance/church-service/{churchServiceId}
        // Permission: Attendance / view
        // =========================================================

        [HttpGet("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "view")]
        public async Task<IActionResult> GetAttendanceForChurchService(
            int churchServiceId)
        {
            var service = await GetTenantChurchServiceAsync(
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
                NormalizeServiceStatus(service.Status);

            // -----------------------------------------------------
            // SERVICE CANCELLED
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // SERVICE NOT COMPLETED
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // GET MEMBERS FOR TENANT
            // -----------------------------------------------------

            var membersQuery =
                GetTenantMembersQuery();

            if (membersQuery == null)
            {
                return CustomerIdUnauthorized();
            }

            var members = await membersQuery
                .AsNoTracking()
                .Where(m =>
                    m.Status != null &&
                    m.Status.ToUpper() == "ACTIVE")
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

            // -----------------------------------------------------
            // EXISTING ATTENDANCE
            // -----------------------------------------------------

            var attendanceQuery =
                GetTenantAttendanceQuery();

            if (attendanceQuery == null)
            {
                return CustomerIdUnauthorized();
            }

            var attendanceRecords =
                await attendanceQuery
                    .AsNoTracking()
                    .Where(a =>
                        a.ChurchServiceId ==
                        churchServiceId)
                    .ToListAsync();

            // -----------------------------------------------------
            // COMBINE MEMBERS + ATTENDANCE
            // -----------------------------------------------------

            var attendance = members
                .Select(member =>
                {
                    var record =
                        attendanceRecords
                            .FirstOrDefault(
                                a =>
                                    a.MemberId ==
                                    member.memberId);

                    return new AttendanceListItem
                    {
                        MemberId =
                            member.memberId,

                        MemberCode =
                            member.memberCode,

                        FirstName =
                            member.firstName,

                        MiddleName =
                            member.middleName,

                        LastName =
                            member.lastName,

                        Status =
                            NormalizeAttendanceStatus(
                                record?.Status),

                        AttendanceId =
                            record?.AttendanceId,

                        AttendanceDate =
                            record?.AttendanceDate
                            ?? service.ServiceDate
                    };
                })
                .ToList();

            var summary =
                BuildAttendanceSummary(
                    attendance.Select(x => x.Status));

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
        // POST:
        // /api/Attendance/church-service/{churchServiceId}
        //
        // Permission: Attendance / create
        // Existing records require Attendance / edit
        // =========================================================

        [HttpPost("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "create")]
        public async Task<IActionResult> SaveAttendance(
            int churchServiceId,
            [FromBody] AttendanceRequest request)
        {
            // -----------------------------------------------------
            // VALIDATE REQUEST
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // GET CURRENT TENANT
            // -----------------------------------------------------

            var customerId =
                GetCurrentCustomerId();

            if (!IsCurrentUserAdmin() &&
                !customerId.HasValue)
            {
                return CustomerIdUnauthorized();
            }

            // -----------------------------------------------------
            // GET SERVICE
            // -----------------------------------------------------

            var service =
                await GetTenantChurchServiceAsync(
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
            // VALIDATE SERVICE STATUS
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // VALIDATE MEMBER IDS
            // -----------------------------------------------------

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

            var memberIds =
                request.Attendance
                    .Select(x => x.MemberId)
                    .Distinct()
                    .ToList();

            if (memberIds.Any(id => id <= 0))
            {
                return BadRequest(new
                {
                    message =
                        "One or more member IDs are invalid."
                });
            }

            // -----------------------------------------------------
            // VALIDATE STATUSES
            // -----------------------------------------------------

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
                                .OrderBy(x => x)
                                .ToArray()
                    });
                }
            }

            // -----------------------------------------------------
            // VALIDATE MEMBERS
            // -----------------------------------------------------

            var membersQuery =
                GetTenantMembersQuery();

            if (membersQuery == null)
            {
                return CustomerIdUnauthorized();
            }

            var validMemberIds =
                await membersQuery
                    .AsNoTracking()
                    .Where(m =>
                        memberIds.Contains(m.MemberId) &&
                        m.Status != null &&
                        m.Status.ToUpper() == "ACTIVE")
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
                        "One or more members are invalid, inactive, or do not belong to your customer.",

                    memberIds =
                        invalidMemberIds
                });
            }

            // -----------------------------------------------------
            // EXISTING RECORDS
            // -----------------------------------------------------

            var existingQuery =
                GetTenantAttendanceQuery();

            if (existingQuery == null)
            {
                return CustomerIdUnauthorized();
            }

            var existingRecords =
                await existingQuery
                    .Where(a =>
                        a.ChurchServiceId ==
                            churchServiceId &&
                        memberIds.Contains(
                            a.MemberId))
                    .ToListAsync();

            // -----------------------------------------------------
            // CHECK EDIT PERMISSION
            // -----------------------------------------------------

            if (existingRecords.Count > 0)
            {
                var canEdit =
                    await _permissionService
                        .HasPermissionAsync(
                            User,
                            "Attendance",
                            "edit");

                if (!canEdit)
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
            }

            // -----------------------------------------------------
            // AUDIT INFORMATION
            // -----------------------------------------------------

            var recordedBy =
                GetCurrentUserName();

            var recordedDate =
                DateTime.Now;

            var existingLookup =
                existingRecords
                    .GroupBy(x => x.MemberId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.First());

            var savedCount = 0;
            var updatedCount = 0;

            // -----------------------------------------------------
            // SAVE / UPDATE
            // -----------------------------------------------------

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

                    existing.ChurchServiceId =
                        churchServiceId;

                    existing.EventId =
                        null;

                    existing.RecordedBy =
                        recordedBy;

                    existing.RecordedDate =
                        recordedDate;

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

                            EventId =
                                null,

                            AttendanceDate =
                                service.ServiceDate,

                            Service =
                                service.ServiceName,

                            Status =
                                status,

                            RecordedBy =
                                recordedBy,

                            RecordedDate =
                                recordedDate
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
        // GET: /api/Attendance/me
        // =========================================================

        [HttpGet("me")]
        public async Task<IActionResult> GetMyAttendance()
        {
            var memberId =
                GetCurrentMemberId();

            if (!memberId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "Your account is not linked to a member record."
                });
            }

            var memberQuery =
                GetTenantMembersQuery();

            if (memberQuery == null)
            {
                return CustomerIdUnauthorized();
            }

            var member =
                await memberQuery
                    .AsNoTracking()
                    .Where(m =>
                        m.MemberId ==
                        memberId.Value)
                    .Select(m => new
                    {
                        memberId =
                            m.MemberId,

                        customerId =
                            m.CustomerId,

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

            // -----------------------------------------------------
            // ATTENDANCE
            // -----------------------------------------------------

            var attendanceQuery =
                GetTenantAttendanceQuery();

            if (attendanceQuery == null)
            {
                return CustomerIdUnauthorized();
            }

            var records =
                await attendanceQuery
                    .AsNoTracking()
                    .Include(a => a.ChurchService)
                    .Where(a =>
                        a.MemberId ==
                        memberId.Value)
                    .OrderByDescending(
                        a => a.AttendanceDate)
                    .ThenByDescending(
                        a => a.AttendanceId)
                    .ToListAsync();

            var attendance =
                records
                    .Select(a => new
                    {
                        attendanceId =
                            a.AttendanceId,

                        memberId =
                            a.MemberId,

                        churchServiceId =
                            a.ChurchServiceId,

                        eventId =
                            a.EventId,

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
                    .ToList();

            var summary =
                BuildAttendanceSummary(
                    attendance.Select(
                        x => x.status));

            return Ok(new
            {
                member,

                summary,

                attendance
            });
        }

        // =========================================================
        // DELETE ATTENDANCE
        // DELETE: /api/Attendance/{id}
        // Permission: Attendance / delete
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Attendance", "delete")]
        public async Task<IActionResult> DeleteAttendance(
            int id)
        {
            var query =
                GetTenantAttendanceQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var attendance =
                await query
                    .FirstOrDefaultAsync(
                        a =>
                            a.AttendanceId ==
                            id);

            if (attendance == null)
            {
                return NotFound(new
                {
                    message =
                        "Attendance record not found.",

                    attendanceId =
                        id
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
        // TENANT-SCOPED ATTENDANCE QUERY
        // =========================================================

        private IQueryable<Attendance>?
            GetTenantAttendanceQuery()
        {
            var query =
                _context.Attendances
                    .AsQueryable();

            // -----------------------------------------------------
            // ADMIN
            // -----------------------------------------------------

            if (IsCurrentUserAdmin())
            {
                return query;
            }

            // -----------------------------------------------------
            // NON-ADMIN
            // -----------------------------------------------------

            var customerId =
                GetCurrentCustomerId();

            if (!customerId.HasValue)
            {
                return null;
            }

            return query.Where(a =>
                a.Member != null &&
                a.Member.CustomerId ==
                customerId.Value);
        }

        // =========================================================
        // TENANT-SCOPED MEMBERS
        // =========================================================

        private IQueryable<Member>?
            GetTenantMembersQuery()
        {
            var query =
                _context.Members
                    .AsQueryable();

            if (IsCurrentUserAdmin())
            {
                return query;
            }

            var customerId =
                GetCurrentCustomerId();

            if (!customerId.HasValue)
            {
                return null;
            }

            return query.Where(m =>
                m.CustomerId ==
                customerId.Value);
        }

        // =========================================================
        // TENANT-SCOPED CHURCH SERVICE
        // =========================================================

        private async Task<ChurchService?>
            GetTenantChurchServiceAsync(
                int churchServiceId)
        {
            var query =
                _context.ChurchServices
                    .AsQueryable();

            if (IsCurrentUserAdmin())
            {
                return await query
                    .FirstOrDefaultAsync(
                        s =>
                            s.ChurchServiceId ==
                            churchServiceId);
            }

            var customerId =
                GetCurrentCustomerId();

            if (!customerId.HasValue)
            {
                return null;
            }

            return await query
                .Where(s =>
                    s.ChurchServiceId ==
                        churchServiceId &&
                    s.CustomerId ==
                        customerId.Value)
                .FirstOrDefaultAsync();
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

            return status
                .Trim()
                .ToUpperInvariant();
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
        // CURRENT USER NAME
        // =========================================================

        private string GetCurrentUserName()
        {
            return
                User.Identity?.Name
                ??
                User.FindFirst(
                    ClaimTypes.Name)?.Value
                ??
                User.FindFirst("name")?.Value
                ??
                User.FindFirst("userName")?.Value
                ??
                User.FindFirst("username")?.Value
                ??
                User.FindFirst(
                    ClaimTypes.Email)?.Value
                ??
                User.FindFirst("email")?.Value
                ??
                "SYSTEM";
        }

        // =========================================================
        // CURRENT CUSTOMER ID
        // =========================================================

        private int? GetCurrentCustomerId()
        {
            var claim =
                User.FindFirst("CustomerId")?.Value
                ??
                User.FindFirst("customerId")?.Value
                ??
                User.FindFirst("customer_id")?.Value;

            if (!int.TryParse(
                claim,
                out var customerId))
            {
                return null;
            }

            return customerId > 0
                ? customerId
                : null;
        }

        // =========================================================
        // CURRENT MEMBER ID
        // =========================================================

        private int? GetCurrentMemberId()
        {
            var claim =
                User.FindFirst("MemberId")?.Value
                ??
                User.FindFirst("memberId")?.Value
                ??
                User.FindFirst("member_id")?.Value;

            if (!int.TryParse(
                claim,
                out var memberId))
            {
                return null;
            }

            return memberId > 0
                ? memberId
                : null;
        }

        // =========================================================
        // CURRENT ROLE
        // =========================================================

        private string GetCurrentRole()
        {
            var role =
                User.FindFirst(
                    ClaimTypes.Role)?.Value
                ??
                User.FindFirst("role")?.Value;

            return role?
                .Trim()
                .ToUpperInvariant()
                ??
                string.Empty;
        }

        // =========================================================
        // ADMIN CHECK
        // =========================================================

        private bool IsCurrentUserAdmin()
        {
            return string.Equals(
                GetCurrentRole(),
                "ADMIN",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // CUSTOMER ID ERROR
        // =========================================================

        private IActionResult
            CustomerIdUnauthorized()
        {
            return Unauthorized(new
            {
                message =
                    "CUSTOMER ID CLAIM IS MISSING OR INVALID."
            });
        }

        // =========================================================
        // BUILD MEMBER NAME
        // =========================================================

        private static string
            BuildMemberName(
                Member member)
        {
            var firstName =
                member.FirstName?
                    .Trim()
                    ?? string.Empty;

            var middleName =
                member.MiddleName?
                    .Trim()
                    ?? string.Empty;

            var lastName =
                member.LastName?
                    .Trim()
                    ?? string.Empty;

            if (string.IsNullOrWhiteSpace(
                lastName))
            {
                return string.Join(
                    " ",
                    new[]
                    {
                        firstName,
                        middleName
                    }.Where(x =>
                        !string.IsNullOrWhiteSpace(x)));
            }

            var givenName =
                string.Join(
                    " ",
                    new[]
                    {
                        firstName,
                        middleName
                    }.Where(x =>
                        !string.IsNullOrWhiteSpace(x)));

            return string.IsNullOrWhiteSpace(
                givenName)
                ? lastName
                : $"{lastName}, {givenName}";
        }

        // =========================================================
        // BUILD ATTENDANCE SUMMARY
        // =========================================================

        private static object
            BuildAttendanceSummary(
                IEnumerable<string?> statuses)
        {
            var normalizedStatuses =
                statuses
                    .Select(
                        NormalizeAttendanceStatus)
                    .ToList();

            return new
            {
                total =
                    normalizedStatuses.Count,

                present =
                    normalizedStatuses.Count(
                        x => x == "PRESENT"),

                late =
                    normalizedStatuses.Count(
                        x => x == "LATE"),

                early =
                    normalizedStatuses.Count(
                        x => x == "EARLY"),

                absent =
                    normalizedStatuses.Count(
                        x => x == "ABSENT"),

                excused =
                    normalizedStatuses.Count(
                        x => x == "EXCUSED")
            };
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
    // RESPONSE MODEL
    // =============================================================

    internal sealed class AttendanceListItem
    {
        public int MemberId { get; set; }

        public string? MemberCode { get; set; }

        public string? FirstName { get; set; }

        public string? MiddleName { get; set; }

        public string? LastName { get; set; }

        public string Status { get; set; } = "PRESENT";

        public int? AttendanceId { get; set; }

        public DateTime AttendanceDate { get; set; }
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