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
        // GET: api/Dashboard
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                // =====================================================
                // DATE
                // =====================================================

                DateTime today = DateTime.Today;
                DateTime tomorrow = today.AddDays(1);

                DateTime recentDate = today.AddDays(-30);


                // =====================================================
                // MEMBERS
                // =====================================================

                int totalMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync();


                int activeMembers =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync(m =>
                            m.Status != null &&
                            m.Status.ToUpper() == "ACTIVE");


                int inactiveMembers =
                    totalMembers - activeMembers;


                // =====================================================
                // VISITORS
                // =====================================================

                int totalVisitors = 0;

                try
                {
                    totalVisitors =
                        await _context.Visitors
                            .AsNoTracking()
                            .CountAsync();
                }
                catch
                {
                    totalVisitors = 0;
                }


                // =====================================================
                // MINISTRIES
                // =====================================================

                int totalMinistries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync();


                int activeMinistries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync(m =>
                            m.Status != null &&
                            m.Status.ToUpper() == "ACTIVE");


                // =====================================================
                // MINISTRY ASSIGNMENTS
                // =====================================================

                int activeMinistryAssignments = 0;

                try
                {
                    activeMinistryAssignments =
                        await _context.MinistryMembers
                            .AsNoTracking()
                            .CountAsync(m =>
                                m.Status != null &&
                                m.Status.ToUpper() == "ACTIVE");
                }
                catch
                {
                    activeMinistryAssignments = 0;
                }


                // =====================================================
                // TODAY'S ATTENDANCE
                // =====================================================

                int attendanceToday =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow);


                int presentToday =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow &&
                            a.Status != null &&
                            a.Status.ToUpper() == "PRESENT");


                int lateToday =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow &&
                            a.Status != null &&
                            a.Status.ToUpper() == "LATE");


                int earlyToday =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow &&
                            a.Status != null &&
                            a.Status.ToUpper() == "EARLY");


                int absentToday =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow &&
                            a.Status != null &&
                            a.Status.ToUpper() == "ABSENT");


                int excusedToday =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow &&
                            a.Status != null &&
                            a.Status.ToUpper() == "EXCUSED");


                // =====================================================
                // ATTENDANCE RATE
                // =====================================================

                int countedAttendance =
                    presentToday +
                    lateToday +
                    earlyToday;


                double attendanceRate = 0;

                if (attendanceToday > 0)
                {
                    attendanceRate =
                        Math.Round(
                            ((double)countedAttendance /
                             attendanceToday) * 100,
                            2);
                }


                // =====================================================
                // RECENT VISITORS COUNT
                // =====================================================

                int recentVisitors = 0;

                try
                {
                    /*
                     * This uses the CreatedAt field if your Visitor
                     * model contains it.
                     *
                     * If your Visitor model does NOT have CreatedAt,
                     * leave this as totalVisitors.
                     */

                    recentVisitors =
                        totalVisitors;
                }
                catch
                {
                    recentVisitors = 0;
                }


                // =====================================================
                // DASHBOARD RESPONSE
                // =====================================================

                return Ok(new
                {
                    generatedAt = DateTime.Now,

                    // =================================================
                    // MEMBERS
                    // =================================================

                    members = new
                    {
                        total = totalMembers,

                        active = activeMembers,

                        inactive = inactiveMembers
                    },


                    // =================================================
                    // VISITORS
                    // =================================================

                    visitors = new
                    {
                        total = totalVisitors,

                        recent = recentVisitors
                    },


                    // =================================================
                    // MINISTRIES
                    // =================================================

                    ministries = new
                    {
                        total = totalMinistries,

                        active = activeMinistries,

                        activeAssignments =
                            activeMinistryAssignments
                    },


                    // =================================================
                    // ATTENDANCE
                    // =================================================

                    attendance = new
                    {
                        date =
                            today.ToString("yyyy-MM-dd"),

                        total =
                            attendanceToday,

                        present =
                            presentToday,

                        late =
                            lateToday,

                        early =
                            earlyToday,

                        absent =
                            absentToday,

                        excused =
                            excusedToday,

                        attendanceRate =
                            attendanceRate
                    },


                    // =================================================
                    // WHAT'S NEW
                    // =================================================

                    whatsNew = new
                    {
                        recentVisitors =
                            recentVisitors,

                        newMembers =
                            0,

                        upcomingEvents =
                            0,

                        ministryUpdates =
                            activeMinistries
                    },


                    // =================================================
                    // STATUS
                    // =================================================

                    status = new
                    {
                        connected = true,

                        message =
                            "EPIC Church records connected successfully.",

                        lastUpdated =
                            DateTime.Now
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "================================================="
                );

                Console.WriteLine(
                    "EPIC DASHBOARD ERROR"
                );

                Console.WriteLine(
                    ex.ToString()
                );

                Console.WriteLine(
                    "================================================="
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load dashboard data.",

                        error =
                            ex.Message,

                        detail =
                            ex.InnerException?.Message
                    }
                );
            }
        }


        // =========================================================
        // GET: api/Dashboard/stats
        // =========================================================

        [HttpGet("stats")]
        public async Task<IActionResult> GetQuickStats()
        {
            try
            {
                DateTime today =
                    DateTime.Today;

                DateTime tomorrow =
                    today.AddDays(1);


                // =====================================================
                // ACTIVE MEMBERS
                // =====================================================

                int members =
                    await _context.Members
                        .AsNoTracking()
                        .CountAsync(m =>
                            m.Status != null &&
                            m.Status.ToUpper() == "ACTIVE");


                // =====================================================
                // TODAY ATTENDANCE
                // =====================================================

                int attendanceToday =
                    await _context.Attendances
                        .AsNoTracking()
                        .CountAsync(a =>
                            a.AttendanceDate >= today &&
                            a.AttendanceDate < tomorrow);


                // =====================================================
                // VISITORS
                // =====================================================

                int visitors = 0;

                try
                {
                    visitors =
                        await _context.Visitors
                            .AsNoTracking()
                            .CountAsync();
                }
                catch
                {
                    visitors = 0;
                }


                // =====================================================
                // MINISTRIES
                // =====================================================

                int ministries =
                    await _context.Ministries
                        .AsNoTracking()
                        .CountAsync(m =>
                            m.Status != null &&
                            m.Status.ToUpper() == "ACTIVE");


                // =====================================================
                // RESPONSE
                // =====================================================

                return Ok(new
                {
                    members,

                    visitors,

                    ministries,

                    attendanceToday
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load dashboard statistics.",

                        error =
                            ex.Message
                    }
                );
            }
        }
    }
}