using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;

namespace EPIC.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnnouncementsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ISmsGatewayService _smsService;
    private readonly ICampaignAutomationService _campaignService;
    private readonly NotificationWakeSignal? _wake;

    public AnnouncementsController(
        ApplicationDbContext context,
        ISmsGatewayService smsService,
        ICampaignAutomationService campaignService,
        NotificationWakeSignal? wake = null)
    {
        _context = context;
        _smsService = smsService;
        _campaignService = campaignService;
        _wake = wake;
    }


    // GET: api/announcements
    // Public website access
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Announcement>>> GetAnnouncements()
    {
        var announcements = await _context.Announcements
            .Where(x => x.IsPublished && x.PublishDate <= DateTime.UtcNow)
            .OrderByDescending(x => x.PublishDate)
            .ToListAsync();

        return Ok(announcements);
    }



    // GET: api/announcements/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Announcement>> GetAnnouncement(int id)
    {
        var announcement = await _context.Announcements
            .FirstOrDefaultAsync(x => x.Id == id && (User.IsInRole("ADMIN") || (x.IsPublished && x.PublishDate <= DateTime.UtcNow)));

        if (announcement == null)
        {
            return NotFound();
        }

        return Ok(announcement);
    }



    // POST: api/announcements
    // Admin only
    [Authorize(Roles = "ADMIN")]
    [HttpPost]
    public async Task<ActionResult<Announcement>> CreateAnnouncement(
        Announcement announcement)
    {
        announcement.Id = 0;
        announcement.PushQueuedAt = null;
        announcement.CreatedDate = DateTime.UtcNow;

        _context.Announcements.Add(announcement);

        await _context.SaveChangesAsync();
        _wake?.Pulse();

        return CreatedAtAction(
            nameof(GetAnnouncement),
            new { id = announcement.Id },
            announcement
        );
    }

    public record BroadcastRequest(
        string Title,
        string Message,
        string? Category,
        string? SendTo,
        int? TargetMinistryId,
        bool? SendPush = true,
        bool? SendSms = false);

    // POST: api/announcements/broadcast
    // Instant Push Notification Blast for Admin
    [Authorize(Roles = "ADMIN")]
    [HttpPost("broadcast")]
    public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Title and message are required." });
        }

        var category = string.IsNullOrWhiteSpace(request.Category) ? "Announcement" : request.Category.Trim();
        var announcement = new Announcement
        {
            Title = request.Title.Trim(),
            Content = request.Message.Trim(),
            Category = category,
            IsPublished = true,
            PublishDate = DateTime.UtcNow,
            CreatedDate = DateTime.UtcNow,
            PushQueuedAt = DateTime.UtcNow
        };

        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        // 1. Get eligible active members matching target audience
        var allEligibleQuery = _context.Users
            .Where(u => u.IsActive && u.MemberId != null &&
                        u.Member != null && u.Member.Status == "ACTIVE");

        List<int> members;

        if (string.IsNullOrWhiteSpace(request.SendTo) || request.SendTo.Trim().Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            members = await allEligibleQuery
                .Select(u => u.MemberId!.Value)
                .Distinct()
                .ToListAsync();
        }
        else
        {
            var targets = request.SendTo.Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => t.ToUpperInvariant())
                .ToList();

            if (targets.Contains("ALL"))
            {
                members = await allEligibleQuery
                    .Select(u => u.MemberId!.Value)
                    .Distinct()
                    .ToListAsync();
            }
            else
            {
                var keywordMap = new Dictionary<string, string[]>
                {
                    { "YOUTH", new[] { "YOUTH" } },
                    { "CHILDREN", new[] { "CHILD", "KID" } },
                    { "WORSHIP", new[] { "WORSHIP", "MUSIC", "BAND" } },
                    { "ADULT", new[] { "ADULT" } },
                    { "YOUNG_ADULT", new[] { "YOUNG ADULT" } },
                    { "LEADERSHIP", new[] { "PASTOR", "LEADER", "HEAD" } },
                    { "DANCE", new[] { "DANCE", "TAMBOURINE" } },
                    { "MEDIA", new[] { "MEDIA", "TECH", "SOUND", "ENGINEERING" } },
                    { "USHERS", new[] { "USHER", "MARSHALL" } },
                    { "FINANCE", new[] { "FINANCE", "TREASUR", "ADMIN" } },
                    { "PRAYER", new[] { "INTERCESS", "PRAYER" } },
                    { "EVANGELISM", new[] { "EVANGEL", "INVIT", "FOLLOW" } },
                    { "LOGISTICS", new[] { "DRIV", "TRANSPORT", "REPAIR" } },
                    { "CARE", new[] { "SANITAR", "PANTRY", "CARE", "CLEAN" } },
                    { "MEN", new[] { "MEN" } },
                    { "WOMEN", new[] { "WOMEN" } }
                };

                var searchKeywords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var t in targets)
                {
                    if (keywordMap.TryGetValue(t, out var kws))
                    {
                        foreach (var kw in kws) searchKeywords.Add(kw);
                    }
                    else
                    {
                        searchKeywords.Add(t);
                    }
                }

                var allActiveUsers = await allEligibleQuery
                    .Select(u => new
                    {
                        u.MemberId,
                        Ministry = u.Member!.Ministry ?? "",
                        Role = u.Role != null ? u.Role.RoleName : ""
                    })
                    .ToListAsync();

                var ministryAssignments = await _context.MinistryMembers
                    .Where(mm => mm.Status == "ACTIVE" && mm.Ministry != null)
                    .Select(mm => new { mm.MemberId, MinistryName = mm.Ministry!.Name })
                    .ToListAsync();

                var ministryByMember = ministryAssignments
                    .GroupBy(x => x.MemberId)
                    .ToDictionary(g => g.Key, g => g.Select(x => x.MinistryName).ToList());

                members = allActiveUsers
                    .Where(u =>
                    {
                        var mUpper = u.Ministry.ToUpperInvariant();
                        var rUpper = u.Role.ToUpperInvariant();
                        var assignedMinistries = ministryByMember.TryGetValue(u.MemberId!.Value, out var mList) ? mList : new List<string>();

                        return searchKeywords.Any(kw =>
                            mUpper.Contains(kw) ||
                            rUpper.Contains(kw) ||
                            assignedMinistries.Any(am => am.ToUpperInvariant().Contains(kw))
                        );
                    })
                    .Select(u => u.MemberId!.Value)
                    .Distinct()
                    .ToList();
            }
        }

        var cleanBody = System.Net.WebUtility.HtmlDecode(System.Text.RegularExpressions.Regex.Replace(announcement.Content, "<[^>]*>", " "));
        var now = DateTime.UtcNow;

        // 2. Add in-app notification records for all members
        foreach (var memberId in members)
        {
            _context.MemberNotifications.Add(new MemberNotification
            {
                MemberId = memberId,
                Kind = "ANNOUNCEMENT",
                AnnouncementId = announcement.Id,
                ReferenceId = announcement.Id,
                Title = announcement.Title.Length > 200 ? announcement.Title[..200] : announcement.Title,
                Body = cleanBody.Length > 2000 ? cleanBody[..1997] + "..." : cleanBody,
                CreatedAt = now,
                ExpandedAt = now
            });
        }

        await _context.SaveChangesAsync();

        // 3. Queue immediate PushDeliveries for active registered devices (if Push requested)
        var devices = new List<PushDevice>();
        if (request.SendPush != false)
        {
            var memberIdSet = members.ToHashSet();
            devices = await _context.PushDevices
                .Where(d => memberIdSet.Contains(d.MemberId) && d.IsActive)
                .ToListAsync();

            var notifLookup = await _context.MemberNotifications
                .Where(n => n.AnnouncementId == announcement.Id)
                .Select(n => new { n.Id, n.MemberId })
                .ToListAsync();

            var notifDict = notifLookup.GroupBy(n => n.MemberId).ToDictionary(g => g.Key, g => g.First().Id);

            foreach (var dev in devices)
            {
                if (notifDict.TryGetValue(dev.MemberId, out var notifId))
                {
                    _context.PushDeliveries.Add(new PushDelivery
                    {
                        NotificationId = notifId,
                        DeviceId = dev.Id,
                        State = "PENDING",
                        NextAttemptAt = now
                    });
                }
            }

            await _context.SaveChangesAsync();

            // 4. Pulse background worker for instant push dispatch
            _wake?.Pulse();
        }

        // 5. Automated Cloud SMS Gateway (Semaphore)
        bool smsSent = false;
        int smsSentCount = 0;
        string? smsStatus = null;

        if (request.SendSms == true)
        {
            if (_smsService.IsConfigured)
            {
                var phoneNumbers = await _context.Members
                    .Where(m => m.Status == "ACTIVE" && !string.IsNullOrWhiteSpace(m.ContactNumber))
                    .Select(m => m.ContactNumber!)
                    .ToListAsync();

                var smsText = $"{announcement.Title}: {cleanBody}";
                if (smsText.Length > 160) smsText = smsText[..157] + "...";

                var result = await _smsService.SendSmsAsync(phoneNumbers, smsText);
                smsSent = result.Success;
                smsSentCount = result.SentCount;
                smsStatus = result.Success ? "SENT" : result.Error;
            }
            else
            {
                smsStatus = "GATEWAY_NOT_CONFIGURED";
            }
        }

        return Ok(new
        {
            success = true,
            announcementId = announcement.Id,
            title = announcement.Title,
            category = announcement.Category,
            recipientCount = members.Count,
            deviceCount = devices.Count,
            smsGatewayConfigured = _smsService.IsConfigured,
            smsSent,
            smsSentCount,
            smsStatus,
            sentAt = now
        });
    }

    [Authorize(Roles = "ADMIN")]
    [HttpGet("broadcasts")]
    public async Task<IActionResult> GetRecentBroadcasts(int take = 20)
    {
        var items = await _context.Announcements.AsNoTracking()
            .OrderByDescending(a => a.CreatedDate)
            .Take(take)
            .ToListAsync();

        var announcementIds = items.Select(a => a.Id).ToList();

        var notifStats = await _context.MemberNotifications.AsNoTracking()
            .Where(n => n.AnnouncementId.HasValue && announcementIds.Contains(n.AnnouncementId.Value))
            .GroupBy(n => n.AnnouncementId!.Value)
            .Select(g => new { AnnouncementId = g.Key, RecipientCount = g.Count(), NotificationIds = g.Select(x => x.Id).ToList() })
            .ToListAsync();

        var allNotifIds = notifStats.SelectMany(s => s.NotificationIds).ToHashSet();

        var deliveredNotifIds = await _context.PushDeliveries.AsNoTracking()
            .Where(d => allNotifIds.Contains(d.NotificationId) && (d.State == "ACCEPTED" || d.State == "TICKET"))
            .Select(d => d.NotificationId)
            .Distinct()
            .ToListAsync();

        var deliveredSet = deliveredNotifIds.ToHashSet();

        var result = items.Select(a => {
            var stats = notifStats.FirstOrDefault(s => s.AnnouncementId == a.Id);
            var deliveredCount = stats?.NotificationIds.Count(id => deliveredSet.Contains(id)) ?? 0;
            return new
            {
                a.Id,
                a.Title,
                a.Content,
                a.Category,
                a.IsPublished,
                a.PublishDate,
                a.CreatedDate,
                RecipientCount = stats?.RecipientCount ?? 0,
                DeliveredCount = deliveredCount
            };
        });

        return Ok(result);
    }



    // PUT: api/announcements/5
    // Admin only
    [Authorize(Roles = "ADMIN")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAnnouncement(
        int id,
        Announcement announcement)
    {
        if (id != announcement.Id)
        {
            return BadRequest();
        }


        var existing =
            await _context.Announcements
            .FirstOrDefaultAsync(x => x.Id == id);


        if (existing == null)
        {
            return NotFound();
        }


        existing.Title = announcement.Title;
        existing.Content = announcement.Content;
        existing.Category = announcement.Category;
        existing.ImageUrl = announcement.ImageUrl;
        existing.IsPublished = announcement.IsPublished;
        existing.PublishDate = announcement.PublishDate;


        await _context.SaveChangesAsync();

        return NoContent();
    }



    // DELETE: api/announcements/5
    // Admin only
    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAnnouncement(int id)
    {
        var announcement =
            await _context.Announcements
            .FirstOrDefaultAsync(x => x.Id == id);


        if (announcement == null)
        {
            return NotFound();
        }


        _context.Announcements.Remove(announcement);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ============================================================
    // PROGRESSIVE CAMPAIGN AUTOMATION (ADMIN)
    // ============================================================

    [Authorize(Roles = "ADMIN")]
    [HttpGet("campaign/status")]
    public IActionResult GetCampaignStatus()
    {
        var status = _campaignService.GetStatus();
        return Ok(status);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpGet("campaign/presets")]
    public IActionResult GetCampaignPresets()
    {
        var presets = _campaignService.GetPresets();
        return Ok(presets);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("campaign/start")]
    public async Task<IActionResult> StartCampaign([FromBody] StartCampaignRequest request)
    {
        try
        {
            var result = await _campaignService.StartCampaignAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("campaign/pause")]
    public async Task<IActionResult> PauseCampaign()
    {
        var result = await _campaignService.PauseCampaignAsync();
        return Ok(result);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("campaign/resume")]
    public async Task<IActionResult> ResumeCampaign()
    {
        var result = await _campaignService.ResumeCampaignAsync();
        return Ok(result);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("campaign/stop")]
    public async Task<IActionResult> StopCampaign()
    {
        var result = await _campaignService.StopCampaignAsync();
        return Ok(result);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("campaign/next")]
    public async Task<IActionResult> TriggerNextStep()
    {
        var result = await _campaignService.TriggerNextStepAsync();
        return Ok(result);
    }
}