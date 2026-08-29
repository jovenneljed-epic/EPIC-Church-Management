
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

        // =========================================================
        // ALLOWED ATTENDANCE STATUSES
        // =========================================================

        private static readonly HashSet<string> AllowedStatuses =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "PRESENT",
                "LATE",
                "EARLY",
                "ABSENT",
                "EXCUSED"
            };

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        public AttendanceController(
            ApplicationDbContext context,
            IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // =========================================================
        // CURRENT USER ID
        // =========================================================

        private int? CurrentUserId
        {
            get
            {
                var value =
                    User.FindFirst("userId")?.Value
                    ??
                    User.FindFirst(
                        ClaimTypes.NameIdentifier)?.Value;

                return int.TryParse(value, out var id) && id > 0
                    ? id
                    : null;
            }
        }

        // =========================================================
        // CURRENT ROLE
        // =========================================================

        private string CurrentRole
        {
            get
            {
                var role =
                    User.FindFirst(ClaimTypes.Role)?.Value
                    ??
                    User.FindFirst("role")?.Value;

                return string.IsNullOrWhiteSpace(role)
                    ? string.Empty
                    : role.Trim().ToUpperInvariant();
            }
        }

        // =========================================================
        // CLIENT ROLE
        //
        // Supports:
        // CLIENT
        // CLIENT_ADMIN
        // CLIENT_MANAGER
        // CLIENT_STAFF
        // CLIENT_*
        // =========================================================

        private bool IsClientRole =>
            CurrentRole == "CLIENT" ||
            CurrentRole.StartsWith("CLIENT_");

        // =========================================================
        // CLIENT MEMBER ID
        // =========================================================

        private int? CurrentClientMemberId
        {
            get
            {
                var value =
                    User.FindFirst("clientMemberId")?.Value;

                return int.TryParse(value, out var id) && id > 0
                    ? id
                    : null;
            }
        }

        // =========================================================
        // CUSTOMER ID FROM TOKEN
        //
        // Used only as fallback for ADMIN.
        // =========================================================

        private int? GetCustomerIdFromToken()
        {
            var value =
                User.FindFirst("customerId")?.Value
                ??
                User.FindFirst("CustomerId")?.Value
                ??
                User.FindFirst("tenantId")?.Value;

            return int.TryParse(value, out var id) && id > 0
                ? id
                : null;
        }

        // =========================================================
        // RESOLVE CURRENT CUSTOMER
        //
        // CLIENT:
        //
        // JWT clientMemberId
        //       ↓
        // ClientMembers
        //       ↓
        // CustomerId
        //
        // ADMIN:
        //
        // UserId
        //       ↓
        // Users
        //       ↓
        // CustomerId
        // =========================================================

        private async Task<int?> GetCurrentCustomerIdAsync()
        {
            // -----------------------------------------------------
            // CLIENT
            // -----------------------------------------------------

            if (IsClientRole)
            {
                var clientMemberId =
                    CurrentClientMemberId;

                if (!clientMemberId.HasValue)
                {
                    return null;
                }

                var clientMember =
                    await _context.ClientMembers
                        .AsNoTracking()
                        .Where(cm =>
                            cm.ClientMemberId ==
                                clientMemberId.Value &&

                            cm.IsActive &&

                            cm.Status != null &&

                            cm.Status.Trim().ToUpper() ==
                                "ACTIVE")
                        .Select(cm => new
                        {
                            cm.CustomerId,

                            CustomerStatus =
                                cm.Customer != null
                                    ? cm.Customer.Status
                                    : null,

                            MemberStatus =
                                cm.Member != null
                                    ? cm.Member.Status
                                    : null,

                            ClientRoleActive =
                                cm.ClientRole != null &&
                                cm.ClientRole.IsActive
                        })
                        .FirstOrDefaultAsync();

                if (clientMember == null)
                {
                    return null;
                }

                if (clientMember.CustomerId <= 0)
                {
                    return null;
                }

                if (!IsActiveStatus(
                        clientMember.CustomerStatus))
                {
                    return null;
                }

                if (!IsActiveStatus(
                        clientMember.MemberStatus))
                {
                    return null;
                }

                if (!clientMember.ClientRoleActive)
                {
                    return null;
                }

                return clientMember.CustomerId;
            }

            // -----------------------------------------------------
            // ADMIN
            // -----------------------------------------------------

            if (CurrentRole == "ADMIN")
            {
                var userId =
                    CurrentUserId;

                if (userId.HasValue)
                {
                    var customerId =
                        await _context.Users
                            .AsNoTracking()
                            .Where(u =>
                                u.UserId ==
                                userId.Value)
                            .Select(u =>
                                u.CustomerId)
                            .FirstOrDefaultAsync();

                    if (customerId > 0)
                    {
                        return customerId;
                    }
                }

                return GetCustomerIdFromToken();
            }

            return null;
        }

        // =========================================================
        // REQUIRE CHURCH ACCESS
        // =========================================================

        private async Task<(
            IActionResult? Error,
            int? CustomerId)>
            RequireChurchAccessAsync()
        {
            // -----------------------------------------------------
            // AUTHENTICATION
            // -----------------------------------------------------

            if (User.Identity?.IsAuthenticated != true)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Authentication is required."
                    }),
                    null
                );
            }

            // -----------------------------------------------------
            // ROLE
            // -----------------------------------------------------

            if (CurrentRole != "ADMIN" &&
                !IsClientRole)
            {
                return (
                    Forbid(),
                    null
                );
            }

            // -----------------------------------------------------
            // CLIENT MEMBER ID
            // -----------------------------------------------------

            if (IsClientRole &&
                !CurrentClientMemberId.HasValue)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Client member identity could not be determined.",

                        role =
                            CurrentRole
                    }),
                    null
                );
            }

            // -----------------------------------------------------
            // CUSTOMER
            // -----------------------------------------------------

            var customerId =
                await GetCurrentCustomerIdAsync();

            if (!customerId.HasValue ||
                customerId.Value <= 0)
            {
                return (
                    Unauthorized(new
                    {
                        message =
                            "Customer identity could not be determined.",

                        role =
                            CurrentRole,

                        userId =
                            CurrentUserId,

                        clientMemberId =
                            CurrentClientMemberId,

                        tokenCustomerId =
                            GetCustomerIdFromToken()
                    }),
                    null
                );
            }

            return (
                null,
                customerId.Value
            );
        }

        // =========================================================
        // PERMISSION HELPER
        //
        // IMPORTANT:
        // The [Permission] attribute is still retained on each
        // endpoint because it is part of your existing permission
        // architecture.
        //
        // This helper is useful for edit/delete checks.
        // =========================================================

        private async Task<bool> HasPermissionAsync(
            string action)
        {
            return await _permissionService
                .HasPermissionAsync(
                    User,
                    "Attendance",
                    action);
        }

        // =========================================================
        // CUSTOMER MEMBERS
        // =========================================================

        private IQueryable<Member>
            CustomerMembers(int customerId)
        {
            return _context.Members
                .Where(m =>
                    m.CustomerId == customerId);
        }

        // =========================================================
        // CUSTOMER SERVICES
        // =========================================================

        private IQueryable<ChurchService>
            CustomerServices(int customerId)
        {
            return _context.ChurchServices
                .Where(s =>
                    s.CustomerId == customerId);
        }

        // =========================================================
        // CUSTOMER ATTENDANCE
        //
        // Attendance
        //     ↓
        // Member
        //     ↓
        // Customer
        //
        // AND
        //
        // Attendance
        //     ↓
        // ChurchService
        //     ↓
        // Customer
        // =========================================================

        private IQueryable<Attendance>
            CustomerAttendance(int customerId)
        {
            return _context.Attendances
                .Where(a =>
                    a.Member != null &&
                    a.Member.CustomerId == customerId &&

                    a.ChurchService != null &&
                    a.ChurchService.CustomerId == customerId);
        }

        // =========================================================
        // GET CUSTOMER SERVICE
        // =========================================================

        private async Task<ChurchService?>
            GetCustomerChurchServiceAsync(
                int churchServiceId,
                int customerId)
        {
            return await CustomerServices(customerId)
                .AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.ChurchServiceId ==
                    churchServiceId);
        }

        // =========================================================
        // GET ALL ATTENDANCE
        //
        // GET:
        // /api/Attendance
        // =========================================================

        [HttpGet]
        [Permission("Attendance", "view")]
        public async Task<IActionResult>
            GetAttendance()
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var records =
                    await CustomerAttendance(customerId)
                        .AsNoTracking()
                        .Include(a => a.Member)
                        .Include(a => a.ChurchService)
                        .OrderByDescending(
                            a => a.AttendanceDate)
                        .ThenByDescending(
                            a => a.AttendanceId)
                        .ToListAsync();

                var result =
                    records.Select(a => new
                    {
                        attendanceId =
                            a.AttendanceId,

                        memberId =
                            a.MemberId,

                        memberCode =
                            a.Member?.MemberCode ??
                            string.Empty,

                        memberName =
                            a.Member != null
                                ? BuildMemberName(a.Member)
                                : string.Empty,

                        churchServiceId =
                            a.ChurchServiceId,

                        eventId =
                            a.EventId,

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
                    }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return AttendanceError(
                    "Unable to load attendance.",
                    ex);
            }
        }

        // =========================================================
        // GET ATTENDANCE FOR CHURCH SERVICE
        //
        // GET:
        // /api/Attendance/church-service/{churchServiceId}
        // =========================================================

        [HttpGet("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "view")]
        public async Task<IActionResult>
            GetAttendanceForChurchService(
                int churchServiceId)
        {
            try
            {
                // -------------------------------------------------
                // ACCESS
                // -------------------------------------------------

                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                // -------------------------------------------------
                // SERVICE
                // -------------------------------------------------

                var service =
                    await GetCustomerChurchServiceAsync(
                        churchServiceId,
                        customerId);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message =
                            "The selected church service was not found.",

                        churchServiceId,

                        customerId
                    });
                }

                // -------------------------------------------------
                // SERVICE STATUS
                // -------------------------------------------------

                var serviceStatus =
                    NormalizeServiceStatus(
                        service.Status);

                if (serviceStatus == "CANCELLED")
                {
                    return Ok(
                        BuildUnavailableServiceResponse(
                            service,
                            "CANCELLED",
                            "This church service was cancelled. Attendance cannot be recorded."));
                }

                if (serviceStatus != "COMPLETED")
                {
                    return Ok(
                        BuildUnavailableServiceResponse(
                            service,
                            serviceStatus,
                            "This church service has not happened yet. Attendance will become available after the service is completed."));
                }

                // -------------------------------------------------
                // ACTIVE MEMBERS
                // -------------------------------------------------

                var members =
                    await CustomerMembers(customerId)
                        .AsNoTracking()
                        .Where(m =>
                            m.Status != null &&
                            m.Status.Trim().ToUpper() ==
                                "ACTIVE")
                        .OrderBy(m => m.LastName)
                        .ThenBy(m => m.FirstName)
                        .Select(m => new
                        {
                            m.MemberId,
                            m.MemberCode,
                            m.FirstName,
                            m.MiddleName,
                            m.LastName
                        })
                        .ToListAsync();

                // -------------------------------------------------
                // EXISTING ATTENDANCE
                // -------------------------------------------------

                var memberIds =
                    members
                        .Select(m => m.MemberId)
                        .ToList();

                var attendanceRecords =
                    memberIds.Count == 0
                        ? new List<Attendance>()
                        : await _context.Attendances
                            .AsNoTracking()
                            .Where(a =>
                                a.ChurchServiceId ==
                                    churchServiceId &&

                                memberIds.Contains(
                                    a.MemberId))
                            .ToListAsync();

                // -------------------------------------------------
                // LOOKUP
                // -------------------------------------------------

                var attendanceLookup =
                    attendanceRecords
                        .GroupBy(a => a.MemberId)
                        .ToDictionary(
                            g => g.Key,
                            g => g.First());

                // -------------------------------------------------
                // COMBINE
                // -------------------------------------------------

                var attendance =
                    members.Select(member =>
                    {
                        attendanceLookup.TryGetValue(
                            member.MemberId,
                            out var record);

                        return new AttendanceListItem
                        {
                            MemberId =
                                member.MemberId,

                            MemberCode =
                                member.MemberCode,

                            FirstName =
                                member.FirstName,

                            MiddleName =
                                member.MiddleName,

                            LastName =
                                member.LastName,

                            Status =
                                NormalizeAttendanceStatus(
                                    record?.Status),

                            AttendanceId =
                                record?.AttendanceId,

                            AttendanceDate =
                                record?.AttendanceDate ??
                                service.ServiceDate
                        };
                    }).ToList();

                // -------------------------------------------------
                // SUMMARY
                // -------------------------------------------------

                var summary =
                    BuildAttendanceSummary(
                        attendance.Select(
                            x => x.Status));

                // -------------------------------------------------
                // RESPONSE
                // -------------------------------------------------

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
            catch (Exception ex)
            {
                return AttendanceError(
                    "Unable to load attendance for the selected church service.",
                    ex);
            }
        }

        // =========================================================
        // SAVE / UPDATE ATTENDANCE
        //
        // POST:
        // /api/Attendance/church-service/{churchServiceId}
        // =========================================================

        [HttpPost("church-service/{churchServiceId:int}")]
        [Permission("Attendance", "create")]
        public async Task<IActionResult>
            SaveAttendance(
                int churchServiceId,
                [FromBody] AttendanceRequest request)
        {
            try
            {
                // -------------------------------------------------
                // REQUEST
                // -------------------------------------------------

                if (request?.Attendance == null ||
                    request.Attendance.Count == 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "No attendance records were provided."
                    });
                }

                // -------------------------------------------------
                // ACCESS
                // -------------------------------------------------

                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                // -------------------------------------------------
                // SERVICE
                // -------------------------------------------------

                var service =
                    await GetCustomerChurchServiceAsync(
                        churchServiceId,
                        customerId);

                if (service == null)
                {
                    return NotFound(new
                    {
                        message =
                            "The selected church service was not found."
                    });
                }

                // -------------------------------------------------
                // SERVICE STATUS
                // -------------------------------------------------

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

                // -------------------------------------------------
                // DUPLICATES
                // -------------------------------------------------

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

                // -------------------------------------------------
                // MEMBER IDS
                // -------------------------------------------------

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

                // -------------------------------------------------
                // STATUS VALIDATION
                // -------------------------------------------------

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

                // -------------------------------------------------
                // VALID CUSTOMER MEMBERS
                // -------------------------------------------------

                var validMemberIds =
                    await CustomerMembers(customerId)
                        .AsNoTracking()
                        .Where(m =>
                            memberIds.Contains(
                                m.MemberId) &&

                            m.Status != null &&

                            m.Status.Trim().ToUpper() ==
                                "ACTIVE")
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

                // -------------------------------------------------
                // EXISTING RECORDS
                // -------------------------------------------------

                var existingRecords =
                    await _context.Attendances
                        .Where(a =>
                            a.ChurchServiceId ==
                                churchServiceId &&

                            memberIds.Contains(
                                a.MemberId))
                        .ToListAsync();

                // -------------------------------------------------
                // EDIT PERMISSION
                // -------------------------------------------------

                if (existingRecords.Count > 0)
                {
                    var canEdit =
                        await HasPermissionAsync("edit");

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

                // -------------------------------------------------
                // AUDIT
                // -------------------------------------------------

                var recordedBy =
                    GetCurrentUserName();

                var recordedDate =
                    DateTime.Now;

                // -------------------------------------------------
                // EXISTING LOOKUP
                // -------------------------------------------------

                var existingLookup =
                    existingRecords
                        .GroupBy(x => x.MemberId)
                        .ToDictionary(
                            g => g.Key,
                            g => g.First());

                var savedCount = 0;
                var updatedCount = 0;

                // -------------------------------------------------
                // SAVE / UPDATE
                // -------------------------------------------------

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
                        _context.Attendances.Add(
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
                            });

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
            catch (DbUpdateException ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to save attendance because the database rejected the operation.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message
                    });
            }
            catch (Exception ex)
            {
                return AttendanceError(
                    "Unable to save attendance.",
                    ex);
            }
        }

        // =========================================================
        // GET MY ATTENDANCE
        //
        // GET:
        // /api/Attendance/me
        // =========================================================

        [HttpGet("me")]
        public async Task<IActionResult>
            GetMyAttendance()
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var clientMemberId =
                    CurrentClientMemberId;

                if (!clientMemberId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message =
                            "Your client member identity could not be determined."
                    });
                }

                // -------------------------------------------------
                // CLIENT MEMBER
                // -------------------------------------------------

                var clientMember =
                    await _context.ClientMembers
                        .AsNoTracking()
                        .Where(cm =>
                            cm.ClientMemberId ==
                                clientMemberId.Value &&

                            cm.CustomerId ==
                                customerId &&

                            cm.IsActive &&

                            cm.Status != null &&

                            cm.Status.Trim().ToUpper() ==
                                "ACTIVE")
                        .Select(cm => new
                        {
                            cm.MemberId,
                            cm.CustomerId
                        })
                        .FirstOrDefaultAsync();

                if (clientMember == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "Your client member account is not valid for this customer."
                    });
                }

                // -------------------------------------------------
                // MEMBER
                // -------------------------------------------------

                var member =
                    await CustomerMembers(customerId)
                        .AsNoTracking()
                        .Where(m =>
                            m.MemberId ==
                                clientMember.MemberId)
                        .Select(m => new
                        {
                            m.MemberId,
                            m.CustomerId,
                            m.MemberCode,
                            m.FirstName,
                            m.MiddleName,
                            m.LastName
                        })
                        .FirstOrDefaultAsync();

                if (member == null)
                {
                    return NotFound(new
                    {
                        message =
                            "The member associated with your client account could not be found."
                    });
                }

                // -------------------------------------------------
                // ATTENDANCE
                // -------------------------------------------------

                var records =
                    await _context.Attendances
                        .AsNoTracking()
                        .Include(a =>
                            a.ChurchService)
                        .Where(a =>
                            a.MemberId ==
                                member.MemberId &&

                            a.ChurchService != null &&

                            a.ChurchService.CustomerId ==
                                customerId)
                        .OrderByDescending(
                            a => a.AttendanceDate)
                        .ThenByDescending(
                            a => a.AttendanceId)
                        .ToListAsync();

                var attendance =
                    records.Select(a => new
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
                    }).ToList();

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
            catch (Exception ex)
            {
                return AttendanceError(
                    "Unable to load your attendance.",
                    ex);
            }
        }

        // =========================================================
        // DELETE ATTENDANCE
        //
        // DELETE:
        // /api/Attendance/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Attendance", "delete")]
        public async Task<IActionResult>
            DeleteAttendance(int id)
        {
            try
            {
                var access =
                    await RequireChurchAccessAsync();

                if (access.Error != null)
                {
                    return access.Error;
                }

                var customerId =
                    access.CustomerId!.Value;

                var attendance =
                    await CustomerAttendance(customerId)
                        .FirstOrDefaultAsync(
                            a =>
                                a.AttendanceId == id);

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
            catch (DbUpdateException ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to delete attendance record because the database rejected the operation.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message
                    });
            }
            catch (Exception ex)
            {
                return AttendanceError(
                    "Unable to delete attendance record.",
                    ex);
            }
        }

        // =========================================================
        // HELPERS
        // =========================================================

        private static bool IsActiveStatus(
            string? status)
        {
            return string.Equals(
                status?.Trim(),
                "ACTIVE",
                StringComparison.OrdinalIgnoreCase);
        }

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

        private static string
            BuildMemberName(
                Member member)
        {
            var firstName =
                member.FirstName?.Trim() ??
                string.Empty;

            var middleName =
                member.MiddleName?.Trim() ??
                string.Empty;

            var lastName =
                member.LastName?.Trim() ??
                string.Empty;

            var givenName =
                string.Join(
                    " ",
                    new[]
                    {
                        firstName,
                        middleName
                    }
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x)));

            if (string.IsNullOrWhiteSpace(lastName))
            {
                return givenName;
            }

            return string.IsNullOrWhiteSpace(givenName)
                ? lastName
                : $"{lastName}, {givenName}";
        }

        private static object
            BuildAttendanceSummary(
                IEnumerable<string?> statuses)
        {
            var normalized =
                statuses
                    .Select(
                        NormalizeAttendanceStatus)
                    .ToList();

            return new
            {
                total =
                    normalized.Count,

                present =
                    normalized.Count(
                        x => x == "PRESENT"),

                late =
                    normalized.Count(
                        x => x == "LATE"),

                early =
                    normalized.Count(
                        x => x == "EARLY"),

                absent =
                    normalized.Count(
                        x => x == "ABSENT"),

                excused =
                    normalized.Count(
                        x => x == "EXCUSED")
            };
        }

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

        // =========================================================
        // STANDARD ATTENDANCE ERROR
        // =========================================================

        private IActionResult AttendanceError(
            string message,
            Exception ex)
        {
            Console.WriteLine(
                "========================================");

            Console.WriteLine(
                "ATTENDANCE API ERROR");

            Console.WriteLine(
                $"Type: {ex.GetType().FullName}");

            Console.WriteLine(
                $"Message: {ex.Message}");

            Console.WriteLine(
                $"Inner: {ex.InnerException?.Message}");

            Console.WriteLine(
                $"Stack: {ex.StackTrace}");

            Console.WriteLine(
                "========================================");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message,

                    exceptionType =
                        ex.GetType().FullName,

                    error =
                        ex.Message,

                    detail =
                        ex.InnerException?.Message
                });
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

        public string Status { get; set; } =
            "PRESENT";

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

        public string Status { get; set; } =
            "PRESENT";
    }
}

