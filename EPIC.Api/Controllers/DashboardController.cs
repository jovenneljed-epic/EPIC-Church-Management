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

        [HttpGet("mobile")]
        public async Task<IActionResult> Mobile()
        {
            var today = DateTime.Today;

            var upcomingService = await _context.ChurchServices
                .Where(s =>
                    s.ServiceDate >= today &&
                    s.Status == "SCHEDULED")
                .OrderBy(s => s.ServiceDate)
                .FirstOrDefaultAsync();

            var result = new
            {
                totalMembers = await _context.Members.CountAsync(),

                activeMembers = await _context.Members
                    .CountAsync(m => m.Status == "Active"),

                totalVisitors = await _context.Visitors.CountAsync(),

                totalMinistries = await _context.Ministries.CountAsync(),

                todayAttendance = await _context.Attendances
                    .CountAsync(a => a.AttendanceDate.Date == today),

                todayGiving = await _context.Givings
                    .Where(g => g.GivingDate.Date == today)
                    .SumAsync(g => (decimal?)g.Amount) ?? 0,

                upcomingService = upcomingService == null
                    ? null
                    : new
                    {
                        upcomingService.ServiceName,
                        upcomingService.ServiceType,
                        upcomingService.ServiceDate,
                        upcomingService.StartTime,
                        upcomingService.EndTime,
                        upcomingService.Location,
                        upcomingService.Speaker
                    }
            };

            return Ok(result);
        }
    }
}