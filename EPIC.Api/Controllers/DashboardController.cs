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

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // WEB DASHBOARD
        // GET: api/Dashboard
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var today = DateTime.Today;
                var tomorrow = today.AddDays(1);

                // =====================================================
                // MEMBERS
                // =====================================================

                var totalMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync();

                var activeMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync(m => m.Status == "Active");

                var inactiveMembers =
                    totalMembers - activeMembers;


                // =====================================================
                // VISITORS
                // =====================================================

                var totalVisitors =
                    await _context.Visitors
                        .AsNoTracking()
                        .CountAsync();


                // =====================================================
                // MINISTRIES
                // =====================================================

                var totalMinistries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync();


                // =====================================================
                // TODAY ATTENDANCE
                //
                // IMPORTANT:
                // Do NOT use:
                //
                // AttendanceDate.Date == today
                //
                // Instead use a date range so SQL Server can
                // efficiently use an index.
                // =====================================================

                var todayAttendance =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow);


                // =====================================================
                // TODAY GIVING
                // =====================================================

                var todayGiving =
                    await _context.Givings
                        .AsNoTracking()
                        .Where(g =>
                            g.GivingDate >= today &&
                            g.GivingDate < tomorrow)
                        .SumAsync(g => (decimal?)g.Amount) ?? 0m;


                // =====================================================
                // TOTAL INCOME
                // =====================================================

                var totalIncome =
                    await _context.Incomes
                        .AsNoTracking()
                        .SumAsync(i => (decimal?)i.Amount) ?? 0m;


                // =====================================================
                // TOTAL EXPENSES
                // =====================================================

                var totalExpenses =
                    await _context.Expenses
                        .AsNoTracking()
                        .SumAsync(e => (decimal?)e.Amount) ?? 0m;


                // =====================================================
                // UPCOMING CHURCH SERVICE
                // =====================================================

                var upcomingService =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .Where(s =>
                            s.ServiceDate >= today &&
                            s.Status == "SCHEDULED")
                        .OrderBy(s => s.ServiceDate)
                        .ThenBy(s => s.StartTime)
                        .Select(s => new
                        {
                            churchServiceId = s.ChurchServiceId,
                            serviceName = s.ServiceName,
                            serviceType = s.ServiceType,
                            serviceDate = s.ServiceDate,
                            startTime = s.StartTime,
                            endTime = s.EndTime,
                            location = s.Location,
                            serviceLeader = s.ServiceLeader,
                            speaker = s.Speaker,
                            description = s.Description,
                            status = s.Status
                        })
                        .FirstOrDefaultAsync();


                // =====================================================
                // EVENT COUNTS
                // =====================================================

                var totalEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync();

                var scheduledEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status == "SCHEDULED");

                var completedEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.Status == "COMPLETED");

                var upcomingEvents =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .CountAsync(s =>
                            s.ServiceDate >= today &&
                            s.Status == "SCHEDULED");


                // =====================================================
                // ATTENDANCE RATE
                // =====================================================

                var attendanceRate =
                    totalMembers == 0
                        ? 0
                        : Math.Round(
                            (double)todayAttendance /
                            totalMembers *
                            100,
                            2
                        );


                // =====================================================
                // RESPONSE
                // =====================================================

                return Ok(new
                {
                    generatedAt = DateTime.UtcNow,

                    members = new
                    {
                        total = totalMembers,
                        active = activeMembers,
                        inactive = inactiveMembers
                    },

                    visitors = new
                    {
                        total = totalVisitors
                    },

                    ministries = new
                    {
                        total = totalMinistries,

                        // Keep existing frontend contract
                        active = totalMinistries,

                        activeAssignments = 0
                    },

                    attendance = new
                    {
                        date = today,

                        total = todayAttendance,

                        present = todayAttendance,

                        late = 0,

                        early = 0,

                        absent = 0,

                        excused = 0,

                        attendanceRate
                    },

                    finance = new
                    {
                        totalGiving = todayGiving,

                        totalExpenses,

                        netChurchFunds =
                            totalIncome -
                            totalExpenses
                    },

                    events = new
                    {
                        total = totalEvents,

                        upcoming = upcomingEvents,

                        scheduled = scheduledEvents,

                        completed = completedEvents,

                        items =
                            upcomingService == null
                                ? Array.Empty<object>()
                                : new object[]
                                {
                                    upcomingService
                                }
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
                    ex.ToString()
                );

                Console.WriteLine(
                    "================================="
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load dashboard data.",

                        error =
                            ex.Message
                    }
                );
            }
        }


        // =========================================================
        // MOBILE DASHBOARD
        // GET: api/Dashboard/mobile
        // =========================================================

        [HttpGet("mobile")]
        public async Task<IActionResult> MobileDashboard()
        {
            try
            {
                var today = DateTime.Today;
                var tomorrow = today.AddDays(1);


                // =====================================================
                // UPCOMING SERVICE
                // =====================================================

                var upcomingService =
                    await _context.ChurchServices
                        .AsNoTracking()
                        .Where(s =>
                            s.ServiceDate >= today &&
                            s.Status == "SCHEDULED")
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


                // =====================================================
                // MEMBERS
                // =====================================================

                var totalMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync();

                var activeMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync(
                            m => m.Status == "Active"
                        );


                // =====================================================
                // VISITORS
                // =====================================================

                var totalVisitors =
                    await _context.Visitors
                        .AsNoTracking()
                        .CountAsync();


                // =====================================================
                // MINISTRIES
                // =====================================================

                var totalMinistries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync();


                // =====================================================
                // ATTENDANCE
                // =====================================================

                var todayAttendance =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow);


                // =====================================================
                // GIVING
                // =====================================================

                var todayGiving =
                    await _context.Givings
                        .AsNoTracking()
                        .Where(g =>
                            g.GivingDate >= today &&
                            g.GivingDate < tomorrow)
                        .SumAsync(
                            g => (decimal?)g.Amount
                        ) ?? 0m;


                // =====================================================
                // RESPONSE
                // =====================================================

                return Ok(new
                {
                    totalMembers,

                    activeMembers,

                    totalVisitors,

                    totalMinistries,

                    todayAttendance,

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
                    ex.ToString()
                );

                Console.WriteLine(
                    "================================="
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load mobile dashboard data.",

                        error =
                            ex.Message
                    }
                );
            }
        }
    }
}