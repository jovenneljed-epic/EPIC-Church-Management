using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

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
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET REPORT DASHBOARD
        // GET: /api/Reports/dashboard
        // =========================================================

        [HttpGet("dashboard")]
        [Permission("Reports", "view")]
        public async Task<IActionResult> GetDashboard()
        {
            var customerId = GetCurrentCustomerId();

            IQueryable<Member> membersQuery =
                _context.Members.AsNoTracking();

            IQueryable<ChurchService> servicesQuery =
                _context.ChurchServices.AsNoTracking();

            IQueryable<Giving> givingQuery =
                _context.Givings.AsNoTracking();

            IQueryable<Attendance> attendanceQuery =
                _context.Attendances.AsNoTracking();

            IQueryable<MinistryMember> ministryMembersQuery =
                _context.MinistryMembers.AsNoTracking();

            if (!IsCurrentUserAdmin())
            {
                if (!customerId.HasValue)
                {
                    return CustomerIdUnauthorized();
                }

                membersQuery =
                    membersQuery.Where(
                        m => m.CustomerId == customerId.Value);

                servicesQuery =
                    servicesQuery.Where(
                        s => s.CustomerId == customerId.Value);

                // Giving does not have CustomerId.
                // Scope it through the member relationship.
                givingQuery =
                    givingQuery.Where(g =>
                        g.Member != null &&
                        g.Member.CustomerId ==
                            customerId.Value);

                attendanceQuery =
                    attendanceQuery.Where(a =>
                        a.Member != null &&
                        a.Member.CustomerId ==
                            customerId.Value);

                ministryMembersQuery =
                    ministryMembersQuery.Where(mm =>
                        mm.Member != null &&
                        mm.Member.CustomerId ==
                            customerId.Value);
            }

            var totalMembers =
                await membersQuery.CountAsync();

            var activeMembers =
                await membersQuery.CountAsync(
                    m => m.Status != null &&
                         m.Status.ToUpper() == "ACTIVE");

            var inactiveMembers =
                await membersQuery.CountAsync(
                    m => m.Status != null &&
                         m.Status.ToUpper() == "INACTIVE");

            var totalServices =
                await servicesQuery.CountAsync();

            var completedServices =
                await servicesQuery.CountAsync(
                    s => s.Status != null &&
                         s.Status.ToUpper() == "COMPLETED");

            var totalAttendance =
                await attendanceQuery.CountAsync();

            var present =
                await attendanceQuery.CountAsync(
                    a => a.Status != null &&
                         a.Status.ToUpper() == "PRESENT");

            var late =
                await attendanceQuery.CountAsync(
                    a => a.Status != null &&
                         a.Status.ToUpper() == "LATE");

            var early =
                await attendanceQuery.CountAsync(
                    a => a.Status != null &&
                         a.Status.ToUpper() == "EARLY");

            var absent =
                await attendanceQuery.CountAsync(
                    a => a.Status != null &&
                         a.Status.ToUpper() == "ABSENT");

            var excused =
                await attendanceQuery.CountAsync(
                    a => a.Status != null &&
                         a.Status.ToUpper() == "EXCUSED");

            var totalGiving =
                await givingQuery
                    .Select(g =>
                        (decimal?)g.Amount)
                    .SumAsync() ?? 0m;

            var totalGivingTransactions =
                await givingQuery.CountAsync();

            var totalMinistryAssignments =
                await ministryMembersQuery.CountAsync();

            var attendanceRate =
                totalAttendance > 0
                    ? Math.Round(
                        (decimal)(
                            present +
                            late +
                            early) /
                        totalAttendance *
                        100m,
                        2)
                    : 0m;

            return Ok(new
            {
                totalMembers,
                activeMembers,
                inactiveMembers,

                totalServices,
                completedServices,

                totalAttendance,

                attendance = new
                {
                    present,
                    late,
                    early,
                    absent,
                    excused,
                    attendanceRate
                },

                giving = new
                {
                    totalGiving,
                    totalTransactions =
                        totalGivingTransactions
                },

                ministryAssignments =
                    totalMinistryAssignments
            });
        }

        // =========================================================
        // GET MEMBERS REPORT
        // GET: /api/Reports/members
        // =========================================================

        [HttpGet("members")]
        [Permission("Reports", "view")]
        public async Task<IActionResult> GetMembersReport()
        {
            var query =
                GetTenantMembersQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var members =
                await query
                    .AsNoTracking()
                    .OrderBy(m => m.LastName)
                    .ThenBy(m => m.FirstName)
                    .Select(m => new
                    {
                        memberId = m.MemberId,
                        memberCode = m.MemberCode,

                        fullName =
                            ((m.FirstName ?? "") + " " +
                             (m.MiddleName ?? "") + " " +
                             (m.LastName ?? "")).Trim(),

                        gender = m.Gender,
                        birthDate = m.BirthDate,
                        contactNumber = m.ContactNumber,
                        civilStatus = m.CivilStatus,
                        ministry = m.Ministry,
                        dateJoined = m.DateJoined,
                        status = m.Status
                    })
                    .ToListAsync();

            return Ok(new
            {
                total = members.Count,

                active =
                    members.Count(m =>
                        string.Equals(
                            m.status,
                            "ACTIVE",
                            StringComparison.OrdinalIgnoreCase)),

                inactive =
                    members.Count(m =>
                        string.Equals(
                            m.status,
                            "INACTIVE",
                            StringComparison.OrdinalIgnoreCase)),

                members
            });
        }

        // =========================================================
        // GET ATTENDANCE REPORT
        // GET: /api/Reports/attendance
        // =========================================================

        [HttpGet("attendance")]
        [Permission("Reports", "view")]
        public async Task<IActionResult> GetAttendanceReport()
        {
            var customerId =
                GetCurrentCustomerId();

            var query =
                _context.Attendances
                    .AsNoTracking()
                    .Include(a => a.Member)
                    .Include(a => a.ChurchService)
                    .AsQueryable();

            if (!IsCurrentUserAdmin())
            {
                if (!customerId.HasValue)
                {
                    return CustomerIdUnauthorized();
                }

                query =
                    query.Where(a =>
                        a.Member != null &&
                        a.Member.CustomerId ==
                            customerId.Value);
            }

            var records =
                await query
                    .OrderByDescending(
                        a => a.AttendanceDate)
                    .ThenByDescending(
                        a => a.AttendanceId)
                    .Select(a => new
                    {
                        attendanceId =
                            a.AttendanceId,

                        memberId =
                            a.MemberId,

                        memberCode =
                            a.Member != null
                                ? a.Member.MemberCode
                                : null,

                        memberName =
                            a.Member != null
                                ? (
                                    (a.Member.FirstName ?? "") +
                                    " " +
                                    (a.Member.MiddleName ?? "") +
                                    " " +
                                    (a.Member.LastName ?? "")
                                  ).Trim()
                                : "—",

                        service =
                            !string.IsNullOrWhiteSpace(
                                a.Service)
                                ? a.Service
                                : a.ChurchService != null
                                    ? a.ChurchService.ServiceName
                                    : "—",

                        churchServiceId =
                            a.ChurchServiceId,

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

            var present =
                records.Count(x =>
                    string.Equals(
                        x.status,
                        "PRESENT",
                        StringComparison.OrdinalIgnoreCase));

            var late =
                records.Count(x =>
                    string.Equals(
                        x.status,
                        "LATE",
                        StringComparison.OrdinalIgnoreCase));

            var early =
                records.Count(x =>
                    string.Equals(
                        x.status,
                        "EARLY",
                        StringComparison.OrdinalIgnoreCase));

            var absent =
                records.Count(x =>
                    string.Equals(
                        x.status,
                        "ABSENT",
                        StringComparison.OrdinalIgnoreCase));

            var excused =
                records.Count(x =>
                    string.Equals(
                        x.status,
                        "EXCUSED",
                        StringComparison.OrdinalIgnoreCase));

            var total =
                records.Count;

            var attended =
                present +
                late +
                early;

            var attendanceRate =
                total > 0
                    ? Math.Round(
                        (decimal)attended /
                        total *
                        100m,
                        2)
                    : 0m;

            return Ok(new
            {
                summary = new
                {
                    total,
                    present,
                    late,
                    early,
                    absent,
                    excused,
                    attendanceRate
                },

                records
            });
        }

        // =========================================================
        // GET GIVING REPORT
        // GET: /api/Reports/giving
        // =========================================================

        [HttpGet("giving")]
        [Permission("Reports", "view")]
        public async Task<IActionResult> GetGivingReport()
        {
            var customerId =
                GetCurrentCustomerId();

            var query =
                _context.Givings
                    .AsNoTracking()
                    .Include(g => g.Member)
                    .Include(g => g.ChurchService)
                    .AsQueryable();

            if (!IsCurrentUserAdmin())
            {
                if (!customerId.HasValue)
                {
                    return CustomerIdUnauthorized();
                }

                query =
                    query.Where(g =>
                        g.Member != null &&
                        g.Member.CustomerId ==
                            customerId.Value);
            }

            var records =
                await query
                    .OrderByDescending(
                        g => g.GivingDate)
                    .ThenByDescending(
                        g => g.GivingId)
                    .Select(g => new
                    {
                        givingId =
                            g.GivingId,

                        memberId =
                            g.MemberId,

                        memberCode =
                            g.Member != null
                                ? g.Member.MemberCode
                                : null,

                        memberName =
                            g.Member != null
                                ? (
                                    (g.Member.FirstName ?? "") +
                                    " " +
                                    (g.Member.MiddleName ?? "") +
                                    " " +
                                    (g.Member.LastName ?? "")
                                  ).Trim()
                                : "—",

                        churchServiceId =
                            g.ChurchServiceId,

                        serviceName =
                            g.ChurchService != null
                                ? g.ChurchService.ServiceName
                                : null,

                        givingType =
                            g.GivingType,

                        amount =
                            g.Amount,

                        givingDate =
                            g.GivingDate,

                        paymentMethod =
                            g.PaymentMethod,

                        referenceNumber =
                            g.ReferenceNumber,

                        notes =
                            g.Notes,

                        recordedBy =
                            g.RecordedBy,

                        recordedDate =
                            g.RecordedDate
                    })
                    .ToListAsync();

            var total =
                records.Sum(x =>
                    Convert.ToDecimal(x.amount));

            var breakdown =
                records
                    .GroupBy(x =>
                        x.givingType ?? "OTHER")
                    .Select(group => new
                    {
                        givingType =
                            group.Key,

                        transactions =
                            group.Count(),

                        amount =
                            group.Sum(x =>
                                Convert.ToDecimal(
                                    x.amount))
                    })
                    .OrderByDescending(
                        x => x.amount)
                    .ToList();

            return Ok(new
            {
                summary = new
                {
                    totalGiving = total,

                    totalTransactions =
                        records.Count
                },

                breakdown,

                records
            });
        }

        // =========================================================
        // GET CHURCH SERVICES REPORT
        // GET: /api/Reports/church-services
        // =========================================================

        [HttpGet("church-services")]
        [Permission("Reports", "view")]
        public async Task<IActionResult>
            GetChurchServicesReport()
        {
            var query =
                GetTenantChurchServicesQuery();

            if (query == null)
            {
                return CustomerIdUnauthorized();
            }

            var services =
                await query
                    .AsNoTracking()
                    .OrderByDescending(
                        s => s.ServiceDate)
                    .ThenByDescending(
                        s => s.ChurchServiceId)
                    .Select(s => new
                    {
                        churchServiceId =
                            s.ChurchServiceId,

                        serviceName =
                            s.ServiceName,

                        serviceType =
                            s.ServiceType,

                        serviceDate =
                            s.ServiceDate,

                        startTime =
                            s.StartTime,

                        endTime =
                            s.EndTime,

                        location =
                            s.Location,

                        serviceLeader =
                            s.ServiceLeader,

                        speaker =
                            s.Speaker,

                        status =
                            s.Status,

                        description =
                            s.Description
                    })
                    .ToListAsync();

            return Ok(new
            {
                total = services.Count,
                services
            });
        }

        // =========================================================
        // GET MINISTRY REPORT
        // GET: /api/Reports/ministries
        // =========================================================

        [HttpGet("ministries")]
        [Permission("Reports", "view")]
        public async Task<IActionResult>
            GetMinistryReport()
        {
            var customerId =
                GetCurrentCustomerId();

            var query =
                _context.Ministries
                    .AsNoTracking()
                    .Include(m => m.MinistryMembers)
                    .ThenInclude(mm => mm.Member)
                    .AsQueryable();

            if (!IsCurrentUserAdmin())
            {
                if (!customerId.HasValue)
                {
                    return CustomerIdUnauthorized();
                }

                query =
                    query.Where(m =>
                        m.MinistryMembers.Any(mm =>
                            mm.Member != null &&
                            mm.Member.CustomerId ==
                                customerId.Value));
            }

            var ministries =
                await query
                    .OrderBy(m => m.Name)
                    .Select(m => new
                    {
                        ministryId =
                            m.MinistryId,

                        name =
                            m.Name,

                        ministryHead =
                            m.MinistryHead,

                        description =
                            m.Description,

                        status =
                            m.Status,

                        memberCount =
                            m.MinistryMembers.Count(
                                mm =>
                                    mm.Member != null &&
                                    (
                                        IsCurrentUserAdminLocal()
                                        ||
                                        mm.Member.CustomerId ==
                                            customerId
                                    ))
                    })
                    .ToListAsync();

            return Ok(new
            {
                total = ministries.Count,
                ministries
            });
        }

        // =========================================================
        // TENANT MEMBERS
        // =========================================================

        private IQueryable<Member>?
            GetTenantMembersQuery()
        {
            var query =
                _context.Members.AsQueryable();

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

            return query.Where(
                m => m.CustomerId ==
                    customerId.Value);
        }

        // =========================================================
        // TENANT CHURCH SERVICES
        // =========================================================

        private IQueryable<ChurchService>?
            GetTenantChurchServicesQuery()
        {
            var query =
                _context.ChurchServices.AsQueryable();

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

            return query.Where(
                s => s.CustomerId ==
                    customerId.Value);
        }

        // =========================================================
        // CUSTOMER ID
        // =========================================================

        private int? GetCurrentCustomerId()
        {
            var claim =
                User.FindFirst("CustomerId")
                    ?.Value
                ??
                User.FindFirst("customerId")
                    ?.Value
                ??
                User.FindFirst("customer_id")
                    ?.Value;

            return int.TryParse(
                    claim,
                    out var customerId) &&
                customerId > 0
                    ? customerId
                    : null;
        }

        // =========================================================
        // ROLE
        // =========================================================

        private string GetCurrentRole()
        {
            var role =
                User.FindFirst(
                    ClaimTypes.Role)?.Value
                ??
                User.FindFirst(
                    "role")?.Value;

            return role?
                .Trim()
                .ToUpperInvariant()
                ?? "";
        }

        // =========================================================
        // ADMIN
        // =========================================================

        private bool IsCurrentUserAdmin()
        {
            return string.Equals(
                GetCurrentRole(),
                "ADMIN",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // LOCAL ADMIN HELPER
        // =========================================================

        private bool IsCurrentUserAdminLocal()
        {
            return IsCurrentUserAdmin();
        }

        // =========================================================
        // UNAUTHORIZED
        // =========================================================

        private UnauthorizedObjectResult
            CustomerIdUnauthorized()
        {
            return Unauthorized(new
            {
                message =
                    "CUSTOMER ID CLAIM IS MISSING OR INVALID."
            });
        }
    }
}