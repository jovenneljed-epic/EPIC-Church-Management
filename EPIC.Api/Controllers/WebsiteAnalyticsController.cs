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
                // -------------------------------------------------
                // REQUIRED FIELDS
                // -------------------------------------------------

                if (string.IsNullOrWhiteSpace(dto.VisitorId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "VisitorId is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(dto.SessionId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "SessionId is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(dto.PageUrl))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "PageUrl is required."
                    });
                }

                // -------------------------------------------------
                // TIME ON PAGE
                // -------------------------------------------------

                var timeOnPage = dto.TimeOnPageSeconds;

                if (timeOnPage.HasValue)
                {
                    timeOnPage = Math.Clamp(
                        timeOnPage.Value,
                        0,
                        86400);
                }

                // -------------------------------------------------
                // VISITED AT
                // -------------------------------------------------

                var now = DateTime.UtcNow;

                var visitedAt =
                    dto.VisitedAt ?? now;

                // Prevent obviously invalid timestamps.
                if (
                    visitedAt < now.AddDays(-7) ||
                    visitedAt > now.AddMinutes(10))
                {
                    visitedAt = now;
                }

                // -------------------------------------------------
                // LAST ACTIVITY
                // -------------------------------------------------

                var lastActivityAt =
                    dto.LastActivityAt ?? visitedAt;

                if (
                    lastActivityAt < visitedAt ||
                    lastActivityAt > now.AddMinutes(10))
                {
                    lastActivityAt = visitedAt;
                }

                // -------------------------------------------------
                // CREATE VISIT
                // -------------------------------------------------

                var visit = new WebsiteVisit
                {
                    VisitorId =
                        dto.VisitorId.Trim(),

                    SessionId =
                        dto.SessionId.Trim(),

                    PageUrl =
                        dto.PageUrl.Trim(),

                    PagePath =
                        dto.PagePath?.Trim(),

                    PageTitle =
                        dto.PageTitle?.Trim(),

                    LandingPage =
                        dto.LandingPage?.Trim(),

                    Referrer =
                        dto.Referrer?.Trim(),

                    // -------------------------------------------------
                    // TRAFFIC
                    // -------------------------------------------------

                    TrafficSource =
                        dto.TrafficSource?.Trim(),

                    TrafficMedium =
                        dto.TrafficMedium?.Trim(),

                    TrafficCampaign =
                        dto.TrafficCampaign?.Trim(),

                    UtmSource =
                        dto.UtmSource?.Trim(),

                    UtmMedium =
                        dto.UtmMedium?.Trim(),

                    UtmCampaign =
                        dto.UtmCampaign?.Trim(),

                    UtmTerm =
                        dto.UtmTerm?.Trim(),

                    UtmContent =
                        dto.UtmContent?.Trim(),

                    // -------------------------------------------------
                    // TECHNOLOGY
                    // -------------------------------------------------

                    DeviceType =
                        dto.DeviceType?.Trim(),

                    Browser =
                        dto.Browser?.Trim(),

                    OperatingSystem =
                        dto.OperatingSystem?.Trim(),

                    ScreenResolution =
                        dto.ScreenResolution?.Trim(),

                    // -------------------------------------------------
                    // LOCATION
                    // -------------------------------------------------

                    Country =
                        dto.Country?.Trim(),

                    Region =
                        dto.Region?.Trim(),

                    City =
                        dto.City?.Trim(),

                    // -------------------------------------------------
                    // ENGAGEMENT
                    // -------------------------------------------------

                    TimeOnPageSeconds =
                        timeOnPage,

                    IsBounce =
                        dto.IsBounce,

                    IsReturningVisitor =
                        dto.IsReturningVisitor,

                    // -------------------------------------------------
                    // TIME
                    // -------------------------------------------------

                    VisitedAt =
                        visitedAt,

                    LastActivityAt =
                        lastActivityAt,

                    // -------------------------------------------------
                    // ADDITIONAL
                    // -------------------------------------------------

                    UserAgent =
                        dto.UserAgent?.Trim(),

                    Language =
                        dto.Language?.Trim(),

                    TimeZone =
                        dto.TimeZone?.Trim()
                };

                _context.WebsiteVisits.Add(visit);

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Website visit recorded. VisitorId={VisitorId}, SessionId={SessionId}, PagePath={PagePath}",
                    visit.VisitorId,
                    visit.SessionId,
                    visit.PagePath);

                return Ok(new
                {
                    success = true,
                    message =
                        "Website visit recorded successfully.",
                    visitId =
                        visit.WebsiteVisitId
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
                        message =
                            "Unable to record website visit."
                    });
            }
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/health
        // PUBLIC
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

                var todayStart =
                    now.Date;

                // Monday-based week
                var daysSinceMonday =
                    ((int)todayStart.DayOfWeek + 6) % 7;

                var weekStart =
                    todayStart.AddDays(
                        -daysSinceMonday);

                var monthStart =
                    new DateTime(
                        now.Year,
                        now.Month,
                        1);

                // -------------------------------------------------
                // BASIC TRAFFIC
                // -------------------------------------------------

                var totalVisits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .CountAsync();

                var todayVisits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .CountAsync(v =>
                            v.VisitedAt >= todayStart);

                var weekVisits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .CountAsync(v =>
                            v.VisitedAt >= weekStart);

                var monthVisits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .CountAsync(v =>
                            v.VisitedAt >= monthStart);

                // -------------------------------------------------
                // VISITORS
                // -------------------------------------------------

                var uniqueVisitors =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .Where(v =>
                            !string.IsNullOrWhiteSpace(
                                v.VisitorId))
                        .Select(v => v.VisitorId)
                        .Distinct()
                        .CountAsync();

                var returningVisitors =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .CountAsync(v =>
                            v.IsReturningVisitor);

                // -------------------------------------------------
                // BOUNCE
                // -------------------------------------------------

                var bounceVisits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .CountAsync(v =>
                            v.IsBounce);

                var bounceRate =
                    totalVisits > 0
                        ? Math.Round(
                            (double)bounceVisits /
                            totalVisits *
                            100,
                            2)
                        : 0;

                // -------------------------------------------------
                // RECENT VISITS
                // -------------------------------------------------

                var recentVisits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .OrderByDescending(
                            v => v.VisitedAt)
                        .Take(10)
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

                            v.VisitedAt,
                            v.LastActivityAt,

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
                        success = false,
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
            try
            {
                days = Math.Clamp(
                    days,
                    7,
                    365);

                var startDate =
                    DateTime.UtcNow
                        .Date
                        .AddDays(-(days - 1));

                var visits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .Where(v =>
                            v.VisitedAt >= startDate)
                        .GroupBy(v =>
                            v.VisitedAt.Date)
                        .Select(g => new
                        {
                            date = g.Key,

                            visits =
                                g.Count(),

                            uniqueVisitors =
                                g.Select(v =>
                                    v.VisitorId)
                                 .Where(id =>
                                    !string.IsNullOrWhiteSpace(id))
                                 .Distinct()
                                 .Count()
                        })
                        .OrderBy(x => x.date)
                        .ToListAsync();

                var result =
                    Enumerable
                        .Range(0, days)
                        .Select(i =>
                        {
                            var date =
                                startDate.AddDays(i);

                            var item =
                                visits.FirstOrDefault(
                                    x => x.date == date);

                            return new
                            {
                                date =
                                    date.ToString(
                                        "yyyy-MM-dd"),

                                visits =
                                    item?.visits ?? 0,

                                uniqueVisitors =
                                    item?.uniqueVisitors ?? 0
                            };
                        })
                        .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading visits over time.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load visit history."
                    });
            }
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
            try
            {
                take = Math.Clamp(
                    take,
                    1,
                    50);

                var pages =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .Where(v =>
                            !string.IsNullOrWhiteSpace(
                                v.PagePath))
                        .GroupBy(v => new
                        {
                            v.PagePath,
                            v.PageTitle
                        })
                        .Select(g => new
                        {
                            pagePath =
                                g.Key.PagePath,

                            pageTitle =
                                g.Key.PageTitle,

                            visits =
                                g.Count(),

                            uniqueVisitors =
                                g.Select(v =>
                                    v.VisitorId)
                                 .Where(id =>
                                    !string.IsNullOrWhiteSpace(id))
                                 .Distinct()
                                 .Count()
                        })
                        .OrderByDescending(
                            x => x.visits)
                        .Take(take)
                        .ToListAsync();

                return Ok(pages);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading top website pages.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load top pages."
                    });
            }
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/devices
        // ADMIN ONLY
        // =========================================================

        [HttpGet("devices")]
        [Authorize]
        public async Task<IActionResult> GetDeviceStatistics()
        {
            try
            {
                var devices =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .GroupBy(v =>
                            string.IsNullOrWhiteSpace(
                                v.DeviceType)
                                ? "Unknown"
                                : v.DeviceType)
                        .Select(g => new
                        {
                            device =
                                g.Key,

                            visits =
                                g.Count()
                        })
                        .OrderByDescending(
                            x => x.visits)
                        .ToListAsync();

                return Ok(devices);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading device statistics.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load device statistics."
                    });
            }
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/browsers
        // ADMIN ONLY
        // =========================================================

        [HttpGet("browsers")]
        [Authorize]
        public async Task<IActionResult> GetBrowserStatistics()
        {
            try
            {
                var browsers =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .GroupBy(v =>
                            string.IsNullOrWhiteSpace(
                                v.Browser)
                                ? "Unknown"
                                : v.Browser)
                        .Select(g => new
                        {
                            browser =
                                g.Key,

                            visits =
                                g.Count()
                        })
                        .OrderByDescending(
                            x => x.visits)
                        .ToListAsync();

                return Ok(browsers);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading browser statistics.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load browser statistics."
                    });
            }
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
            try
            {
                take = Math.Clamp(
                    take,
                    1,
                    100);

                var visits =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .OrderByDescending(
                            v => v.VisitedAt)
                        .Take(take)
                        .Select(v => new
                        {
                            v.WebsiteVisitId,

                            v.VisitorId,
                            v.SessionId,

                            v.PageUrl,
                            v.PagePath,
                            v.PageTitle,

                            v.LandingPage,
                            v.Referrer,

                            v.TrafficSource,
                            v.TrafficMedium,
                            v.TrafficCampaign,

                            v.UtmSource,
                            v.UtmMedium,
                            v.UtmCampaign,
                            v.UtmTerm,
                            v.UtmContent,

                            v.DeviceType,
                            v.Browser,
                            v.OperatingSystem,
                            v.ScreenResolution,

                            v.Country,
                            v.Region,
                            v.City,

                            v.TimeOnPageSeconds,

                            v.IsBounce,
                            v.IsReturningVisitor,

                            v.VisitedAt,
                            v.LastActivityAt,

                            v.Language,
                            v.TimeZone
                        })
                        .ToListAsync();

                return Ok(visits);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading recent website visits.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load recent website visits."
                    });
            }
        }

        // =========================================================
        // GET: api/WebsiteAnalytics/traffic-sources
        // TRAFFIC SOURCE ANALYTICS
        // ADMIN ONLY
        // =========================================================

        [HttpGet("traffic-sources")]
        [Authorize]
        public async Task<IActionResult> GetTrafficSources()
        {
            try
            {
                var trafficData =
                    await _context.WebsiteVisits
                        .AsNoTracking()
                        .Select(v => new
                        {
                            Source =
                                !string.IsNullOrWhiteSpace(
                                    v.TrafficSource)
                                    ? v.TrafficSource
                                    : !string.IsNullOrWhiteSpace(
                                        v.UtmSource)
                                        ? v.UtmSource
                                        : !string.IsNullOrWhiteSpace(
                                            v.Referrer)
                                            ? v.Referrer
                                            : "Direct",

                            Medium =
                                !string.IsNullOrWhiteSpace(
                                    v.TrafficMedium)
                                    ? v.TrafficMedium
                                    : !string.IsNullOrWhiteSpace(
                                        v.UtmMedium)
                                        ? v.UtmMedium
                                        : "none",

                            Campaign =
                                !string.IsNullOrWhiteSpace(
                                    v.TrafficCampaign)
                                    ? v.TrafficCampaign
                                    : !string.IsNullOrWhiteSpace(
                                        v.UtmCampaign)
                                        ? v.UtmCampaign
                                        : null,

                            v.VisitorId
                        })
                        .ToListAsync();

                var totalVisits =
                    trafficData.Count;

                var result =
                    trafficData
                        .GroupBy(x => new
                        {
                            x.Source,
                            x.Medium,
                            x.Campaign
                        })
                        .Select(g => new
                        {
                            source =
                                g.Key.Source,

                            medium =
                                g.Key.Medium,

                            campaign =
                                g.Key.Campaign,

                            visits =
                                g.Count(),

                            uniqueVisitors =
                                g.Select(x =>
                                    x.VisitorId)
                                 .Where(id =>
                                    !string.IsNullOrWhiteSpace(id))
                                 .Distinct()
                                 .Count(),

                            percentage =
                                totalVisits > 0
                                    ? Math.Round(
                                        (double)g.Count() /
                                        totalVisits *
                                        100,
                                        2)
                                    : 0
                        })
                        .OrderByDescending(
                            x => x.visits)
                        .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading website traffic source analytics.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load website traffic source analytics."
                    });
            }
        }
        // =========================================================
        // GET: api/WebsiteAnalytics/countries
        // VISITOR GEOGRAPHY - COUNTRIES
        // ADMIN ONLY
        // =========================================================

        [HttpGet("countries")]
        [Authorize]
        public async Task<IActionResult> GetCountryStatistics()
        {
            try
            {
                var data = await _context.WebsiteVisits
                    .AsNoTracking()
                    .Where(v =>
                        !string.IsNullOrWhiteSpace(v.Country))
                    .GroupBy(v => v.Country)
                    .Select(g => new
                    {
                        country = g.Key,

                        visits = g.Count(),

                        uniqueVisitors = g
                            .Select(v => v.VisitorId)
                            .Where(id =>
                                !string.IsNullOrWhiteSpace(id))
                            .Distinct()
                            .Count()
                    })
                    .OrderByDescending(x => x.visits)
                    .ToListAsync();

                var totalVisits = data.Sum(x => x.visits);

                var result = data
                    .Select(x => new
                    {
                        x.country,
                        x.visits,
                        x.uniqueVisitors,

                        percentage = totalVisits > 0
                            ? Math.Round(
                                (double)x.visits /
                                totalVisits *
                                100,
                                2)
                            : 0
                    })
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading website country analytics.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load country analytics."
                    });
            }
        }
        // =========================================================
        // GET: api/WebsiteAnalytics/cities
        // VISITOR GEOGRAPHY - CITIES
        // ADMIN ONLY
        // =========================================================

        [HttpGet("cities")]
        [Authorize]
        public async Task<IActionResult> GetCityStatistics()
        {
            try
            {
                var data = await _context.WebsiteVisits
                    .AsNoTracking()
                    .Where(v =>
                        !string.IsNullOrWhiteSpace(v.City))
                    .GroupBy(v => new
                    {
                        v.City,
                        v.Region,
                        v.Country
                    })
                    .Select(g => new
                    {
                        city = g.Key.City,
                        region = g.Key.Region,
                        country = g.Key.Country,

                        visits = g.Count(),

                        uniqueVisitors = g
                            .Select(v => v.VisitorId)
                            .Where(id =>
                                !string.IsNullOrWhiteSpace(id))
                            .Distinct()
                            .Count()
                    })
                    .OrderByDescending(x => x.visits)
                    .Take(100)
                    .ToListAsync();

                var totalVisits = data.Sum(x => x.visits);

                var result = data
                    .Select(x => new
                    {
                        x.city,
                        x.region,
                        x.country,
                        x.visits,
                        x.uniqueVisitors,

                        percentage = totalVisits > 0
                            ? Math.Round(
                                (double)x.visits /
                                totalVisits *
                                100,
                                2)
                            : 0
                    })
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error loading website city analytics.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message =
                            "Unable to load city analytics."
                    });
            }
        }
    }
}