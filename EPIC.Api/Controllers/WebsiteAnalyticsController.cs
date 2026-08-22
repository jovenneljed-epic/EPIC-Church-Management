using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Models.WebsiteAnalytics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebsiteAnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WebsiteAnalyticsController> _logger;

        public WebsiteAnalyticsController(
            ApplicationDbContext context,
            ILogger<WebsiteAnalyticsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // =========================================================
        // POST: api/WebsiteAnalytics
        // PUBLIC WEBSITE VISIT TRACKING
        // =========================================================

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> RecordVisit(
            [FromBody] WebsiteVisitCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                if (string.IsNullOrWhiteSpace(dto.VisitorId))
                {
                    return BadRequest(new
                    {
                        message = "VisitorId is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(dto.SessionId))
                {
                    return BadRequest(new
                    {
                        message = "SessionId is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(dto.PageUrl))
                {
                    return BadRequest(new
                    {
                        message = "PageUrl is required."
                    });
                }

                var timeOnPage = dto.TimeOnPageSeconds;

                if (timeOnPage.HasValue)
                {
                    timeOnPage = Math.Clamp(
                        timeOnPage.Value,
                        0,
                        86400);
                }

                var visitedAt = dto.VisitedAt ?? DateTime.UtcNow;

                var now = DateTime.UtcNow;

                if (visitedAt < now.AddDays(-7) ||
                    visitedAt > now.AddMinutes(10))
                {
                    visitedAt = now;
                }

                var visit = new WebsiteVisit
                {
                    VisitorId = dto.VisitorId.Trim(),
                    SessionId = dto.SessionId.Trim(),

                    PageUrl = dto.PageUrl.Trim(),
                    PagePath = dto.PagePath?.Trim(),
                    PageTitle = dto.PageTitle?.Trim(),
                    LandingPage = dto.LandingPage?.Trim(),

                    Referrer = dto.Referrer?.Trim(),

                    TrafficSource = dto.TrafficSource?.Trim(),
                    TrafficMedium = dto.TrafficMedium?.Trim(),
                    TrafficCampaign = dto.TrafficCampaign?.Trim(),

                    UtmSource = dto.UtmSource?.Trim(),
                    UtmMedium = dto.UtmMedium?.Trim(),
                    UtmCampaign = dto.UtmCampaign?.Trim(),
                    UtmTerm = dto.UtmTerm?.Trim(),
                    UtmContent = dto.UtmContent?.Trim(),

                    DeviceType = dto.DeviceType?.Trim(),
                    Browser = dto.Browser?.Trim(),
                    OperatingSystem = dto.OperatingSystem?.Trim(),
                    ScreenResolution = dto.ScreenResolution?.Trim(),

                    Country = dto.Country?.Trim(),
                    Region = dto.Region?.Trim(),
                    City = dto.City?.Trim(),

                    TimeOnPageSeconds = timeOnPage,

                    IsBounce = dto.IsBounce,
                    IsReturningVisitor = dto.IsReturningVisitor,

                    VisitedAt = visitedAt,

                    LastActivityAt =
                        dto.LastActivityAt ?? visitedAt,

                    UserAgent = dto.UserAgent?.Trim(),
                    Language = dto.Language?.Trim(),
                    TimeZone = dto.TimeZone?.Trim()
                };

                _context.WebsiteVisits.Add(visit);

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Website visit recorded. VisitorId={VisitorId}, PagePath={PagePath}",
                    visit.VisitorId,
                    visit.PagePath);

                return Ok(new
                {
                    success = true,
                    message = "Website visit recorded successfully.",
                    visitId = visit.WebsiteVisitId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error recording website visit.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message = "Unable to record website visit."
                    });
            }
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/health
        // =========================================================

        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult Health()
        {
            return Ok(new
            {
                success = true,
                service = "Website Analytics",
                status = "Online",
                timestamp = DateTime.UtcNow
            });
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/dashboard
        // ADMIN ONLY
        // =========================================================

        [HttpGet("dashboard")]
        [Authorize]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var now = DateTime.UtcNow;

                var todayStart = now.Date;

                var weekStart = todayStart.AddDays(
                    -((int)todayStart.DayOfWeek + 6) % 7);

                var monthStart = new DateTime(
                    now.Year,
                    now.Month,
                    1);

                var totalVisits = await _context.WebsiteVisits
                    .AsNoTracking()
                    .CountAsync();

                var todayVisits = await _context.WebsiteVisits
                    .AsNoTracking()
                    .CountAsync(v =>
                        v.VisitedAt >= todayStart);

                var weekVisits = await _context.WebsiteVisits
                    .AsNoTracking()
                    .CountAsync(v =>
                        v.VisitedAt >= weekStart);

                var monthVisits = await _context.WebsiteVisits
                    .AsNoTracking()
                    .CountAsync(v =>
                        v.VisitedAt >= monthStart);

                var uniqueVisitors = await _context.WebsiteVisits
                    .AsNoTracking()
                    .Select(v => v.VisitorId)
                    .Distinct()
                    .CountAsync();

                var returningVisitors = await _context.WebsiteVisits
                    .AsNoTracking()
                    .CountAsync(v =>
                        v.IsReturningVisitor);

                var bounceVisits = await _context.WebsiteVisits
                    .AsNoTracking()
                    .CountAsync(v =>
                        v.IsBounce);

                var bounceRate = totalVisits > 0
                    ? Math.Round(
                        (double)bounceVisits / totalVisits * 100,
                        2)
                    : 0;

                var recentVisits = await _context.WebsiteVisits
                    .AsNoTracking()
                    .OrderByDescending(v => v.VisitedAt)
                    .Take(10)
                    .Select(v => new
                    {
                        v.WebsiteVisitId,
                        v.PagePath,
                        v.PageTitle,
                        v.DeviceType,
                        v.Browser,
                        v.OperatingSystem,
                        v.Country,
                        v.City,
                        v.VisitedAt,
                        v.IsReturningVisitor,
                        v.IsBounce
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalVisits,
                    todayVisits,
                    weekVisits,
                    monthVisits,

                    uniqueVisitors,
                    returningVisitors,
                    bounceVisits,
                    bounceRate,

                    recentVisits
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading website analytics dashboard.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load website analytics dashboard."
                    });
            }
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/visits-over-time
        // ADMIN ONLY
        // =========================================================

        [HttpGet("visits-over-time")]
        [Authorize]
        public async Task<IActionResult> GetVisitsOverTime(
            [FromQuery] int days = 30)
        {
            days = Math.Clamp(days, 7, 365);

            var startDate = DateTime.UtcNow
                .Date
                .AddDays(-(days - 1));

            var visits = await _context.WebsiteVisits
                .AsNoTracking()
                .Where(v => v.VisitedAt >= startDate)
                .GroupBy(v => v.VisitedAt.Date)
                .Select(g => new
                {
                    date = g.Key,
                    visits = g.Count(),
                    uniqueVisitors = g
                        .Select(v => v.VisitorId)
                        .Distinct()
                        .Count()
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            var result = Enumerable
                .Range(0, days)
                .Select(i =>
                {
                    var date = startDate.AddDays(i);

                    var visit = visits.FirstOrDefault(
                        x => x.date == date);

                    return new
                    {
                        date = date.ToString("yyyy-MM-dd"),
                        visits = visit?.visits ?? 0,
                        uniqueVisitors =
                            visit?.uniqueVisitors ?? 0
                    };
                })
                .ToList();

            return Ok(result);
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/top-pages
        // ADMIN ONLY
        // =========================================================

        [HttpGet("top-pages")]
        [Authorize]
        public async Task<IActionResult> GetTopPages(
            [FromQuery] int take = 10)
        {
            take = Math.Clamp(take, 1, 50);

            var pages = await _context.WebsiteVisits
                .AsNoTracking()
                .Where(v => !string.IsNullOrEmpty(v.PagePath))
                .GroupBy(v => new
                {
                    v.PagePath,
                    v.PageTitle
                })
                .Select(g => new
                {
                    pagePath = g.Key.PagePath,
                    pageTitle = g.Key.PageTitle,
                    visits = g.Count(),
                    uniqueVisitors = g
                        .Select(v => v.VisitorId)
                        .Distinct()
                        .Count()
                })
                .OrderByDescending(x => x.visits)
                .Take(take)
                .ToListAsync();

            return Ok(pages);
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/devices
        // ADMIN ONLY
        // =========================================================

        [HttpGet("devices")]
        [Authorize]
        public async Task<IActionResult> GetDeviceStatistics()
        {
            var devices = await _context.WebsiteVisits
                .AsNoTracking()
                .GroupBy(v =>
                    string.IsNullOrEmpty(v.DeviceType)
                        ? "Unknown"
                        : v.DeviceType)
                .Select(g => new
                {
                    device = g.Key,
                    visits = g.Count()
                })
                .OrderByDescending(x => x.visits)
                .ToListAsync();

            return Ok(devices);
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/browsers
        // ADMIN ONLY
        // =========================================================

        [HttpGet("browsers")]
        [Authorize]
        public async Task<IActionResult> GetBrowserStatistics()
        {
            var browsers = await _context.WebsiteVisits
                .AsNoTracking()
                .GroupBy(v =>
                    string.IsNullOrEmpty(v.Browser)
                        ? "Unknown"
                        : v.Browser)
                .Select(g => new
                {
                    browser = g.Key,
                    visits = g.Count()
                })
                .OrderByDescending(x => x.visits)
                .ToListAsync();

            return Ok(browsers);
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/recent
        // ADMIN ONLY
        // =========================================================

        [HttpGet("recent")]
        [Authorize]
        public async Task<IActionResult> GetRecentVisits(
            [FromQuery] int take = 20)
        {
            take = Math.Clamp(take, 1, 100);

            var visits = await _context.WebsiteVisits
                .AsNoTracking()
                .OrderByDescending(v => v.VisitedAt)
                .Take(take)
                .Select(v => new
                {
                    v.WebsiteVisitId,
                    v.VisitorId,
                    v.SessionId,
                    v.PageUrl,
                    v.PagePath,
                    v.PageTitle,
                    v.Referrer,
                    v.TrafficSource,
                    v.TrafficMedium,
                    v.TrafficCampaign,
                    v.DeviceType,
                    v.Browser,
                    v.OperatingSystem,
                    v.Country,
                    v.Region,
                    v.City,
                    v.TimeOnPageSeconds,
                    v.IsBounce,
                    v.IsReturningVisitor,
                    v.VisitedAt,
                    v.LastActivityAt
                })
                .ToListAsync();

            return Ok(visits);
        }
    }
}