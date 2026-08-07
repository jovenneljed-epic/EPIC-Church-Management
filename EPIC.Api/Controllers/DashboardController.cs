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

            var result = new
            {
                totalMembers = await _context.Members
                    .CountAsync(),

                activeMembers = await _context.Members
                    .CountAsync(m => m.Status == "Active"),


                totalVisitors = await _context.Visitors
                    .CountAsync(),


                totalMinistries = await _context.Ministries
                    .CountAsync(),


                todayAttendance = await _context.Attendances
                    .CountAsync(a => a.AttendanceDate.Date == today),


                todayGiving = await _context.Givings
                    .Where(g => g.GivingDate.Date == today)
                    .SumAsync(g => (decimal?)g.Amount) ?? 0,


                totalIncome = await _context.Incomes
                    .SumAsync(i => (decimal?)i.Amount) ?? 0,


                totalExpenses = await _context.Expenses
                    .SumAsync(e => (decimal?)e.Amount) ?? 0,


                upcomingService = await _context.ChurchServices
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
                    .FirstOrDefaultAsync()
            };


            return Ok(result);
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