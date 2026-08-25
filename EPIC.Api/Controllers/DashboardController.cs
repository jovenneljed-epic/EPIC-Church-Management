using EPIC.Api.Data;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/Dashboard
        // WEB DASHBOARD
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                // =================================================
                // CURRENT TIME
                // =================================================

                var nowUtc =
                    DateTime.UtcNow;

                // EPIC uses Philippine time for dashboard dates.
                var philippinesTime =
                    GetPhilippineTime(nowUtc);

                var today =
                    philippinesTime.Date;

                var tomorrow =
                    today.AddDays(1);

                // =================================================
                // DATE RANGES
                // =================================================

                var firstDayOfMonth =
                    new DateTime(
                        today.Year,
                        today.Month,
                        1);

                var firstDayOfNextMonth =
                    firstDayOfMonth.AddMonths(1);

                var firstDayOfYear =
                    new DateTime(
                        today.Year,
                        1,
                        1);

                var firstDayOfNextYear =
                    firstDayOfYear.AddYears(1);

                // =================================================
                // MEMBERS
                // =================================================

                var totalMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync();

                var activeMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync(m =>
                            m.Status != null &&
                            m.Status.ToUpper() == "ACTIVE");

                var inactiveMembers =
                    Math.Max(
                        0,
                        totalMembers - activeMembers);

                // =================================================
                // VISITORS
                // =================================================

                var totalVisitors =
                    await _context.Visitors
                        .AsNoTracking()
                        .CountAsync();

                // =================================================
                // MINISTRIES
                // =================================================

                var totalMinistries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync();

                var activeMinistries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync(m =>
                            m.Status != null &&
                            m.Status.ToUpper() == "ACTIVE");

                // =================================================
                // ATTENDANCE
                // TODAY
                //
                // Uses Attendance.Status:
                //
                // PRESENT
                // LATE
                // EARLY
                // ABSENT
                // EXCUSED
                // =================================================

                var todayAttendanceStatuses =
                    await _context.Attendances
                        .AsNoTracking()
                        .Where(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow)
                        .Select(a => a.Status)
                        .ToListAsync();

                var totalAttendance =
                    todayAttendanceStatuses.Count;

                var presentAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "PRESENT",
                            StringComparison.OrdinalIgnoreCase));

                var lateAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "LATE",
                            StringComparison.OrdinalIgnoreCase));

                var earlyAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "EARLY",
                            StringComparison.OrdinalIgnoreCase));

                var absentAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "ABSENT",
                            StringComparison.OrdinalIgnoreCase));

                var excusedAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "EXCUSED",
                            StringComparison.OrdinalIgnoreCase));

                // =================================================
                // ATTENDANCE RATE
                //
                // PRESENT + LATE + EARLY
                // are considered attended.
                //
                // Attendance Rate =
                // Attended / Active Members * 100
                // =================================================

                var attendedCount =
                    presentAttendance +
                    lateAttendance +
                    earlyAttendance;

                var attendanceRate =
                    activeMembers == 0
                        ? 0
                        : Math.Round(
                            (double)attendedCount /
                            activeMembers *
                            100,
                            2);

                // =================================================
                // TODAY GIVING
                // =================================================

                var todayGiving =
                    await _context.Givings
                        .AsNoTracking()
                        .Where(g =>
                            g.GivingDate >= today &&
                            g.GivingDate < tomorrow)
                        .SumAsync(
                            g => (decimal?)g.Amount)
                    ?? 0m;

                // =================================================
                // TOTAL GIVING
                // =================================================

                var totalGiving =
                    await _context.Givings
                        .AsNoTracking()
                        .SumAsync(
                            g => (decimal?)g.Amount)
                    ?? 0m;

                // =================================================
                // TOTAL INCOME
                // =================================================

                var totalIncome =
                    await _context.Incomes
                        .AsNoTracking()
                        .SumAsync(
                            i => (decimal?)i.Amount)
                    ?? 0m;

                // =================================================
                // TOTAL EXPENSES
                // =================================================

                var totalExpenses =
                    await _context.Expenses
                        .AsNoTracking()
                        .SumAsync(
                            e => (decimal?)e.Amount)
                    ?? 0m;

                // =================================================
                // NET CHURCH FUNDS
                //
                // Current EPIC accounting logic:
                //
                // Total Income - Total Expenses
                // =================================================

                var netChurchFunds =
                    totalIncome -
                    totalExpenses;

                // =================================================
                // UPCOMING CHURCH SERVICE
                // =================================================

                var upcomingService =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .Where(s =>
                            s.ServiceDate >= today &&
                            s.Status != null &&
                            s.Status.ToUpper() == "SCHEDULED")
                        .OrderBy(s => s.ServiceDate)
                        .ThenBy(s => s.StartTime)
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

                            description =
                                s.Description,

                            status =
                                s.Status
                        })
                        .FirstOrDefaultAsync();

                // =================================================
                // EVENT COUNTS
                // =================================================

                var totalEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync();

                var scheduledEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "SCHEDULED");

                var completedEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "COMPLETED");

                var upcomingEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.ServiceDate >= today &&
                            s.Status != null &&
                            s.Status.ToUpper() == "SCHEDULED");

                // =================================================
                // SUBSCRIPTIONS
                // =================================================

                var totalSubscriptions =
                    await _context.Subscriptions
                        .AsNoTracking()
                        .CountAsync();

                var trialSubscriptions =
                    await _context.Subscriptions
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "TRIAL");

                var activeSubscriptions =
                    await _context.Subscriptions
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "ACTIVE");

                var pastDueSubscriptions =
                    await _context.Subscriptions
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "PAST_DUE");

                var suspendedSubscriptions =
                    await _context.Subscriptions
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "SUSPENDED");

                var expiredSubscriptions =
                    await _context.Subscriptions
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "EXPIRED");

                var cancelledSubscriptions =
                    await _context.Subscriptions
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status != null &&
                            s.Status.ToUpper() == "CANCELLED");

                // =================================================
                // PAYMENTS
                // =================================================

                var totalPayments =
                    await _context.Payments
                        .AsNoTracking()
                        .CountAsync();

                var paidPayments =
                    await _context.Payments
                        .AsNoTracking()
                        .CountAsync(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "PAID");

                var pendingPayments =
                    await _context.Payments
                        .AsNoTracking()
                        .CountAsync(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "PENDING");

                var failedPayments =
                    await _context.Payments
                        .AsNoTracking()
                        .CountAsync(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "FAILED");

                var refundedPayments =
                    await _context.Payments
                        .AsNoTracking()
                        .CountAsync(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "REFUNDED");

                var cancelledPayments =
                    await _context.Payments
                        .AsNoTracking()
                        .CountAsync(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "CANCELLED");

                // =================================================
                // REVENUE
                // =================================================

                var totalRevenue =
                    await _context.Payments
                        .AsNoTracking()
                        .Where(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "PAID")
                        .SumAsync(
                            p => (decimal?)p.Amount)
                    ?? 0m;

                var currentMonthRevenue =
                    await _context.Payments
                        .AsNoTracking()
                        .Where(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "PAID" &&
                            p.PaidDate.HasValue &&
                            p.PaidDate.Value >= firstDayOfMonth &&
                            p.PaidDate.Value < firstDayOfNextMonth)
                        .SumAsync(
                            p => (decimal?)p.Amount)
                    ?? 0m;

                var currentYearRevenue =
                    await _context.Payments
                        .AsNoTracking()
                        .Where(p =>
                            p.Status != null &&
                            p.Status.ToUpper() == "PAID" &&
                            p.PaidDate.HasValue &&
                            p.PaidDate.Value >= firstDayOfYear &&
                            p.PaidDate.Value < firstDayOfNextYear)
                        .SumAsync(
                            p => (decimal?)p.Amount)
                    ?? 0m;

                // =================================================
                // RESPONSE
                // =================================================

                return Ok(new
                {
                    generatedAt =
                        nowUtc,

                    // =================================================
                    // MEMBERS
                    // =================================================

                    members = new
                    {
                        total =
                            totalMembers,

                        active =
                            activeMembers,

                        inactive =
                            inactiveMembers
                    },

                    // =================================================
                    // VISITORS
                    // =================================================

                    visitors = new
                    {
                        total =
                            totalVisitors
                    },

                    // =================================================
                    // MINISTRIES
                    // =================================================

                    ministries = new
                    {
                        total =
                            totalMinistries,

                        active =
                            activeMinistries,

                        // No MinistryAssignment calculation yet.
                        activeAssignments =
                            0
                    },

                    // =================================================
                    // ATTENDANCE
                    // =================================================

                    attendance = new
                    {
                        date =
                            today,

                        total =
                            totalAttendance,

                        present =
                            presentAttendance,

                        late =
                            lateAttendance,

                        early =
                            earlyAttendance,

                        absent =
                            absentAttendance,

                        excused =
                            excusedAttendance,

                        attendanceRate
                    },

                    // =================================================
                    // FINANCE
                    // =================================================

                    finance = new
                    {
                        // Total giving across all records.
                        totalGiving =
                            totalGiving,

                        // Today's giving.
                        todayGiving =
                            todayGiving,

                        totalIncome =
                            totalIncome,

                        totalExpenses =
                            totalExpenses,

                        netChurchFunds =
                            netChurchFunds
                    },

                    // =================================================
                    // EVENTS
                    // =================================================

                    events = new
                    {
                        total =
                            totalEvents,

                        upcoming =
                            upcomingEvents,

                        scheduled =
                            scheduledEvents,

                        completed =
                            completedEvents,

                        items =
                            upcomingService == null
                                ? Array.Empty<object>()
                                : new object[]
                                {
                                    upcomingService
                                }
                    },

                    // =================================================
                    // SUBSCRIPTIONS
                    // =================================================

                    subscriptions = new
                    {
                        total =
                            totalSubscriptions,

                        trial =
                            trialSubscriptions,

                        active =
                            activeSubscriptions,

                        pastDue =
                            pastDueSubscriptions,

                        suspended =
                            suspendedSubscriptions,

                        expired =
                            expiredSubscriptions,

                        cancelled =
                            cancelledSubscriptions
                    },

                    // =================================================
                    // PAYMENTS
                    // =================================================

                    payments = new
                    {
                        total =
                            totalPayments,

                        paid =
                            paidPayments,

                        pending =
                            pendingPayments,

                        failed =
                            failedPayments,

                        refunded =
                            refundedPayments,

                        cancelled =
                            cancelledPayments
                    },

                    // =================================================
                    // REVENUE
                    // =================================================

                    revenue = new
                    {
                        total =
                            totalRevenue,

                        currentMonth =
                            currentMonthRevenue,

                        currentYear =
                            currentYearRevenue
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "================================="
                );

                Console.WriteLine(
                    "DASHBOARD API ERROR"
                );

                Console.WriteLine(
                    ex
                );

                Console.WriteLine(
                    "================================="
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load dashboard data.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // GET: api/Dashboard/mobile
        // MOBILE DASHBOARD
        // =========================================================

        [HttpGet("mobile")]
        public async Task<IActionResult> MobileDashboard()
        {
            try
            {
                // =================================================
                // PHILIPPINE DATE
                // =================================================

                var philippinesTime =
                    GetPhilippineTime(
                        DateTime.UtcNow);

                var today =
                    philippinesTime.Date;

                var tomorrow =
                    today.AddDays(1);

                // =================================================
                // UPCOMING SERVICE
                // =================================================

                var upcomingService =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .Where(s =>
                            s.ServiceDate >= today &&
                            s.Status != null &&
                            s.Status.ToUpper() == "SCHEDULED")
                        .OrderBy(s => s.ServiceDate)
                        .ThenBy(s => s.StartTime)
                        .Select(s => new
                        {
                            s.ServiceName,
                            s.ServiceType,
                            s.ServiceDate,
                            s.StartTime,
                            s.EndTime,
                            s.Location,
                            s.Speaker
                        })
                        .FirstOrDefaultAsync();

                // =================================================
                // MEMBERS
                // =================================================

                var totalMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync();

                var activeMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync(m =>
                            m.Status != null &&
                            m.Status.ToUpper() == "ACTIVE");

                // =================================================
                // VISITORS
                // =================================================

                var totalVisitors =
                    await _context.Visitors
                        .AsNoTracking()
                        .CountAsync();

                // =================================================
                // MINISTRIES
                // =================================================

                var totalMinistries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync();

                // =================================================
                // ATTENDANCE
                // TODAY
                // =================================================

                var todayAttendanceStatuses =
                    await _context.Attendances
                        .AsNoTracking()
                        .Where(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow)
                        .Select(a => a.Status)
                        .ToListAsync();

                var totalAttendance =
                    todayAttendanceStatuses.Count;

                var presentAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "PRESENT",
                            StringComparison.OrdinalIgnoreCase));

                var lateAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "LATE",
                            StringComparison.OrdinalIgnoreCase));

                var earlyAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "EARLY",
                            StringComparison.OrdinalIgnoreCase));

                var absentAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "ABSENT",
                            StringComparison.OrdinalIgnoreCase));

                var excusedAttendance =
                    todayAttendanceStatuses.Count(status =>
                        string.Equals(
                            status?.Trim(),
                            "EXCUSED",
                            StringComparison.OrdinalIgnoreCase));

                // =================================================
                // ATTENDANCE RATE
                // =================================================

                var attendedCount =
                    presentAttendance +
                    lateAttendance +
                    earlyAttendance;

                var attendanceRate =
                    activeMembers == 0
                        ? 0
                        : Math.Round(
                            (double)attendedCount /
                            activeMembers *
                            100,
                            2);

                // =================================================
                // TODAY GIVING
                // =================================================

                var todayGiving =
                    await _context.Givings
                        .AsNoTracking()
                        .Where(g =>
                            g.GivingDate >= today &&
                            g.GivingDate < tomorrow)
                        .SumAsync(
                            g => (decimal?)g.Amount)
                    ?? 0m;

                // =================================================
                // RESPONSE
                // =================================================

                return Ok(new
                {
                    generatedAt =
                        DateTime.UtcNow,

                    totalMembers,

                    activeMembers,

                    totalVisitors,

                    totalMinistries,

                    todayAttendance =
                        totalAttendance,

                    presentAttendance,

                    lateAttendance,

                    earlyAttendance,

                    absentAttendance,

                    excusedAttendance,

                    attendanceRate,

                    todayGiving,

                    upcomingService
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "================================="
                );

                Console.WriteLine(
                    "MOBILE DASHBOARD API ERROR"
                );

                Console.WriteLine(
                    ex
                );

                Console.WriteLine(
                    "================================="
                );

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load mobile dashboard data.",

                        error =
                            ex.Message
                    });
            }
        }

        // =========================================================
        // PHILIPPINE TIME
        // =========================================================

        private static DateTime GetPhilippineTime(
            DateTime utcDateTime)
        {
            try
            {
                // Linux / Render
                var philippinesZone =
                    TimeZoneInfo.FindSystemTimeZoneById(
                        "Asia/Manila");

                return TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.SpecifyKind(
                        utcDateTime,
                        DateTimeKind.Utc),
                    philippinesZone);
            }
            catch
            {
                try
                {
                    // Windows fallback
                    var philippinesZone =
                        TimeZoneInfo.FindSystemTimeZoneById(
                            "Singapore Standard Time");

                    return TimeZoneInfo.ConvertTimeFromUtc(
                        DateTime.SpecifyKind(
                            utcDateTime,
                            DateTimeKind.Utc),
                        philippinesZone);
                }
                catch
                {
                    // Final fallback: UTC + 8
                    return utcDateTime.AddHours(8);
                }
            }
        }
    }
}