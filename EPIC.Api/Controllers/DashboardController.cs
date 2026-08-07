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


        // WEB DASHBOARD
        // GET: api/Dashboard
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var today = DateTime.Today;

            var totalMembers = await _context.Members.CountAsync();
            var activeMembers = await _context.Members.CountAsync(m => m.Status == "Active");
            var inactiveMembers = totalMembers - activeMembers;

            var totalVisitors = await _context.Visitors.CountAsync();

            var totalMinistries = await _context.Ministries.CountAsync();

            var todayAttendance = await _context.Attendances
                .CountAsync(a => a.AttendanceDate.Date == today);

            var todayGiving = await _context.Givings
                .Where(g => g.GivingDate.Date == today)
                .SumAsync(g => (decimal?)g.Amount) ?? 0;

            var totalIncome = await _context.Incomes
                .SumAsync(i => (decimal?)i.Amount) ?? 0;

            var totalExpenses = await _context.Expenses
                .SumAsync(e => (decimal?)e.Amount) ?? 0;

            var upcomingService = await _context.ChurchServices
                .Where(s =>
                    s.ServiceDate >= today &&
                    s.Status == "SCHEDULED")
                .OrderBy(s => s.ServiceDate)
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
                    attendanceRate = totalMembers == 0
                        ? 0
                        : Math.Round((double)todayAttendance / totalMembers * 100, 2)
                },

                finance = new
                {
                    totalGiving = todayGiving,
                    totalExpenses = totalExpenses,
                    netChurchFunds = totalIncome - totalExpenses
                },

                events = new
                {
                    total = await _context.ChurchServices.CountAsync(),
                    upcoming = await _context.ChurchServices.CountAsync(s =>
                        s.ServiceDate >= today &&
                        s.Status == "SCHEDULED"),
                    scheduled = await _context.ChurchServices.CountAsync(s =>
                        s.Status == "SCHEDULED"),
                    completed = await _context.ChurchServices.CountAsync(s =>
                        s.Status == "COMPLETED"),
                    items = upcomingService == null
                        ? new object[] { }
                        : new[] { upcomingService }
                }
            });
        }


        // MOBILE DASHBOARD
        // GET: api/Dashboard/mobile
        [HttpGet("mobile")]
        public async Task<IActionResult> MobileDashboard()
        {
            var today = DateTime.Today;


            var upcomingService = await _context.ChurchServices
                .Where(s =>
                    s.ServiceDate >= today &&
                    s.Status == "SCHEDULED")
                .OrderBy(s => s.ServiceDate)
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



            var result = new
            {
                totalMembers = await _context.Members.CountAsync(),

                activeMembers = await _context.Members
                    .CountAsync(m => m.Status == "Active"),


                totalVisitors = await _context.Visitors
                    .CountAsync(),


                totalMinistries = await _context.Ministries
                    .CountAsync(),


                todayAttendance = await _context.Attendances
                    .CountAsync(a =>
                        a.AttendanceDate.Date == today),


                todayGiving = await _context.Givings
                    .Where(g =>
                        g.GivingDate.Date == today)
                    .SumAsync(g => (decimal?)g.Amount) ?? 0,


                upcomingService
            };


            return Ok(result);
        }
    }
}