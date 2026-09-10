using System.Collections.Concurrent;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Services;

public class CampaignStepDto
{
    public int Level { get; set; }
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public string Status { get; set; } = "PENDING"; // PENDING, DISPATCHED, SKIPPED, FAILED
    public DateTime? DispatchedAt { get; set; }
    public int RecipientCount { get; set; }
    public int SmsCount { get; set; }
}

public class CampaignStatusDto
{
    public string CampaignId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Status { get; set; } = "IDLE"; // IDLE, RUNNING, PAUSED, COMPLETED, CANCELLED
    public int IntervalMinutes { get; set; } = 5;
    public string SendTo { get; set; } = "ALL";
    public bool SendPush { get; set; } = true;
    public bool SendSms { get; set; } = false;
    public int CurrentStepIndex { get; set; } = 0;
    public int TotalSteps { get; set; } = 0;
    public DateTime? StartedAt { get; set; }
    public DateTime? NextExecutionAt { get; set; }
    public double? SecondsRemainingToNext { get; set; }
    public List<CampaignStepDto> Steps { get; set; } = new();
    public int TotalDispatchedMembers { get; set; } = 0;
    public int TotalDispatchedSms { get; set; } = 0;
}

public class StartCampaignRequest
{
    public string Name { get; set; } = "Automated Church Broadcast";
    public int IntervalMinutes { get; set; } = 5;
    public string SendTo { get; set; } = "ALL";
    public bool SendPush { get; set; } = true;
    public bool SendSms { get; set; } = false;
    public List<CampaignStepInput> Steps { get; set; } = new();
}

public class CampaignStepInput
{
    public int Level { get; set; }
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
}

public class CampaignPresetDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int DefaultIntervalMinutes { get; set; } = 5;
    public string DefaultSendTo { get; set; } = "ALL";
    public List<CampaignStepInput> Steps { get; set; } = new();
}

public interface ICampaignAutomationService
{
    CampaignStatusDto GetStatus();
    Task<CampaignStatusDto> StartCampaignAsync(StartCampaignRequest request);
    Task<CampaignStatusDto> PauseCampaignAsync();
    Task<CampaignStatusDto> ResumeCampaignAsync();
    Task<CampaignStatusDto> StopCampaignAsync();
    Task<CampaignStatusDto> TriggerNextStepAsync();
    List<CampaignPresetDto> GetPresets();
}

public sealed class CampaignAutomationService : ICampaignAutomationService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly NotificationWakeSignal? _wake;
    private readonly ILogger<CampaignAutomationService> _logger;

    private readonly object _syncLock = new();
    private CancellationTokenSource? _campaignCts;
    private Task? _runnerTask;

    // Live Campaign State
    private string _campaignId = "";
    private string _name = "";
    private string _status = "IDLE";
    private int _intervalMinutes = 5;
    private string _sendTo = "ALL";
    private bool _sendPush = true;
    private bool _sendSms = false;
    private int _currentStepIndex = 0;
    private DateTime? _startedAt;
    private DateTime? _nextExecutionAt;
    private readonly List<CampaignStepDto> _steps = new();

    public CampaignAutomationService(
        IServiceScopeFactory scopeFactory,
        ILogger<CampaignAutomationService> logger,
        NotificationWakeSignal? wake = null)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _wake = wake;
    }

    public CampaignStatusDto GetStatus()
    {
        lock (_syncLock)
        {
            double? secondsRemaining = null;
            if (_status == "RUNNING" && _nextExecutionAt.HasValue)
            {
                var diff = (_nextExecutionAt.Value - DateTime.UtcNow).TotalSeconds;
                secondsRemaining = diff > 0 ? Math.Round(diff, 0) : 0;
            }

            return new CampaignStatusDto
            {
                CampaignId = _campaignId,
                Name = _name,
                Status = _status,
                IntervalMinutes = _intervalMinutes,
                SendTo = _sendTo,
                SendPush = _sendPush,
                SendSms = _sendSms,
                CurrentStepIndex = _currentStepIndex,
                TotalSteps = _steps.Count,
                StartedAt = _startedAt,
                NextExecutionAt = _nextExecutionAt,
                SecondsRemainingToNext = secondsRemaining,
                Steps = _steps.Select(s => new CampaignStepDto
                {
                    Level = s.Level,
                    Title = s.Title,
                    Message = s.Message,
                    Status = s.Status,
                    DispatchedAt = s.DispatchedAt,
                    RecipientCount = s.RecipientCount,
                    SmsCount = s.SmsCount
                }).ToList(),
                TotalDispatchedMembers = _steps.Where(s => s.Status == "DISPATCHED").Sum(s => s.RecipientCount),
                TotalDispatchedSms = _steps.Where(s => s.Status == "DISPATCHED").Sum(s => s.SmsCount)
            };
        }
    }

    public async Task<CampaignStatusDto> StartCampaignAsync(StartCampaignRequest request)
    {
        if (request == null || request.Steps == null || request.Steps.Count == 0)
        {
            throw new ArgumentException("At least one campaign level/step is required.");
        }

        // Cancel any active campaign
        await StopInternalAsync();

        lock (_syncLock)
        {
            _campaignId = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            _name = string.IsNullOrWhiteSpace(request.Name) ? "Church Progressive Broadcast" : request.Name.Trim();
            _intervalMinutes = Math.Clamp(request.IntervalMinutes, 1, 1440);
            _sendTo = string.IsNullOrWhiteSpace(request.SendTo) ? "ALL" : request.SendTo.Trim();
            _sendPush = request.SendPush;
            _sendSms = request.SendSms;
            _startedAt = DateTime.UtcNow;
            _status = "RUNNING";
            _currentStepIndex = 0;

            _steps.Clear();
            for (int i = 0; i < request.Steps.Count; i++)
            {
                var input = request.Steps[i];
                _steps.Add(new CampaignStepDto
                {
                    Level = input.Level > 0 ? input.Level : (i + 1),
                    Title = input.Title?.Trim() ?? $"Level {i + 1}",
                    Message = input.Message?.Trim() ?? "",
                    Status = "PENDING"
                });
            }

            _campaignCts = new CancellationTokenSource();
        }

        // Dispatch Level 1 immediately!
        await DispatchStepAsync(0);

        lock (_syncLock)
        {
            if (_steps.Count > 1)
            {
                _nextExecutionAt = DateTime.UtcNow.AddMinutes(_intervalMinutes);
                var token = _campaignCts!.Token;
                _runnerTask = Task.Run(() => RunCampaignLoopAsync(token), token);
            }
            else
            {
                _status = "COMPLETED";
                _nextExecutionAt = null;
            }
        }

        return GetStatus();
    }

    public Task<CampaignStatusDto> PauseCampaignAsync()
    {
        lock (_syncLock)
        {
            if (_status == "RUNNING")
            {
                _status = "PAUSED";
                _logger.LogInformation("Campaign {Id} paused by admin.", _campaignId);
            }
        }
        return Task.FromResult(GetStatus());
    }

    public Task<CampaignStatusDto> ResumeCampaignAsync()
    {
        lock (_syncLock)
        {
            if (_status == "PAUSED")
            {
                _status = "RUNNING";
                _nextExecutionAt = DateTime.UtcNow.AddMinutes(_intervalMinutes);
                _logger.LogInformation("Campaign {Id} resumed by admin. Next blast at {Next}", _campaignId, _nextExecutionAt);
            }
        }
        return Task.FromResult(GetStatus());
    }

    public async Task<CampaignStatusDto> StopCampaignAsync()
    {
        await StopInternalAsync();
        lock (_syncLock)
        {
            _status = "CANCELLED";
            _nextExecutionAt = null;
        }
        return GetStatus();
    }

    public async Task<CampaignStatusDto> TriggerNextStepAsync()
    {
        int nextIndex = -1;
        lock (_syncLock)
        {
            if (_status == "RUNNING" || _status == "PAUSED")
            {
                nextIndex = _currentStepIndex + 1;
            }
        }

        if (nextIndex >= 0 && nextIndex < _steps.Count)
        {
            await DispatchStepAsync(nextIndex);
            lock (_syncLock)
            {
                if (_currentStepIndex + 1 < _steps.Count)
                {
                    _nextExecutionAt = DateTime.UtcNow.AddMinutes(_intervalMinutes);
                }
                else
                {
                    _status = "COMPLETED";
                    _nextExecutionAt = null;
                }
            }
        }

        return GetStatus();
    }

    private async Task StopInternalAsync()
    {
        CancellationTokenSource? ctsToCancel = null;
        Task? taskToWait = null;

        lock (_syncLock)
        {
            if (_campaignCts != null)
            {
                ctsToCancel = _campaignCts;
                _campaignCts = null;
            }
            taskToWait = _runnerTask;
            _runnerTask = null;
        }

        if (ctsToCancel != null)
        {
            ctsToCancel.Cancel();
            ctsToCancel.Dispose();
        }

        if (taskToWait != null)
        {
            try
            {
                await taskToWait;
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error waiting for campaign runner task to stop.");
            }
        }
    }

    private async Task RunCampaignLoopAsync(CancellationToken token)
    {
        _logger.LogInformation("Campaign {Id} loop started. Interval: {Mins} mins", _campaignId, _intervalMinutes);

        while (!token.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(1000, token);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            int stepToRun = -1;

            lock (_syncLock)
            {
                if (_status == "RUNNING" && _nextExecutionAt.HasValue && DateTime.UtcNow >= _nextExecutionAt.Value)
                {
                    stepToRun = _currentStepIndex + 1;
                }
            }

            if (stepToRun > 0 && stepToRun < _steps.Count)
            {
                await DispatchStepAsync(stepToRun);

                lock (_syncLock)
                {
                    if (_currentStepIndex + 1 < _steps.Count)
                    {
                        _nextExecutionAt = DateTime.UtcNow.AddMinutes(_intervalMinutes);
                    }
                    else
                    {
                        _status = "COMPLETED";
                        _nextExecutionAt = null;
                        _logger.LogInformation("Campaign {Id} completed all {Total} levels!", _campaignId, _steps.Count);
                        break;
                    }
                }
            }
        }
    }

    private async Task DispatchStepAsync(int stepIndex)
    {
        CampaignStepDto step;
        string sendTo;
        bool sendPush;
        bool sendSms;
        string campName;

        lock (_syncLock)
        {
            if (stepIndex < 0 || stepIndex >= _steps.Count) return;
            step = _steps[stepIndex];
            _currentStepIndex = stepIndex;
            sendTo = _sendTo;
            sendPush = _sendPush;
            sendSms = _sendSms;
            campName = _name;
        }

        _logger.LogInformation("Dispatching Campaign Step Level {Level}: {Title}", step.Level, step.Title);

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var smsGateway = scope.ServiceProvider.GetRequiredService<ISmsGatewayService>();

            var now = DateTime.UtcNow;

            // 1. Create Announcement record
            var announcement = new Announcement
            {
                Title = $"[L{step.Level}] {step.Title}",
                Content = step.Message,
                Category = "CAMPAIGN",
                IsPublished = true,
                PublishDate = now,
                CreatedDate = now,
                PushQueuedAt = now
            };

            db.Announcements.Add(announcement);
            await db.SaveChangesAsync();

            // 2. Resolve target members
            var allEligibleQuery = db.Users
                .Where(u => u.IsActive && u.MemberId != null &&
                            u.Member != null && u.Member.Status == "ACTIVE");

            List<int> memberIds;
            if (string.IsNullOrWhiteSpace(sendTo) || sendTo.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                memberIds = await allEligibleQuery
                    .Select(u => u.MemberId!.Value)
                    .Distinct()
                    .ToListAsync();
            }
            else
            {
                var targets = sendTo.Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(t => t.ToUpperInvariant())
                    .ToList();

                if (targets.Contains("ALL"))
                {
                    memberIds = await allEligibleQuery
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

                    var ministryAssignments = await db.MinistryMembers
                        .Where(mm => mm.Status == "ACTIVE" && mm.Ministry != null)
                        .Select(mm => new { mm.MemberId, MinistryName = mm.Ministry!.Name })
                        .ToListAsync();

                    var ministryByMember = ministryAssignments
                        .GroupBy(x => x.MemberId)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.MinistryName).ToList());

                    memberIds = allActiveUsers
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

            // 3. Add MemberNotifications
            foreach (var memberId in memberIds)
            {
                db.MemberNotifications.Add(new MemberNotification
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

            await db.SaveChangesAsync();

            // 4. Push deliveries
            if (sendPush)
            {
                var memberIdSet = memberIds.ToHashSet();
                var devices = await db.PushDevices
                    .Where(d => memberIdSet.Contains(d.MemberId) && d.IsActive)
                    .ToListAsync();

                var notifLookup = await db.MemberNotifications
                    .Where(n => n.AnnouncementId == announcement.Id)
                    .Select(n => new { n.Id, n.MemberId })
                    .ToListAsync();

                var notifDict = notifLookup.GroupBy(n => n.MemberId).ToDictionary(g => g.Key, g => g.First().Id);

                foreach (var dev in devices)
                {
                    if (notifDict.TryGetValue(dev.MemberId, out var notifId))
                    {
                        db.PushDeliveries.Add(new PushDelivery
                        {
                            NotificationId = notifId,
                            DeviceId = dev.Id,
                            State = "PENDING",
                            NextAttemptAt = now
                        });
                    }
                }

                await db.SaveChangesAsync();
                _wake?.Pulse();
            }

            // 5. Cloud SMS
            int smsCount = 0;
            if (sendSms && smsGateway.IsConfigured)
            {
                var targetedSet = memberIds.ToHashSet();
                var phoneNumbers = await db.Members
                    .Where(m => targetedSet.Contains(m.MemberId) && m.Status == "ACTIVE" && !string.IsNullOrWhiteSpace(m.ContactNumber))
                    .Select(m => m.ContactNumber!)
                    .ToListAsync();

                var smsText = $"{announcement.Title}: {cleanBody}";
                if (smsText.Length > 160) smsText = smsText[..157] + "...";

                var res = await smsGateway.SendSmsAsync(phoneNumbers, smsText);
                if (res.Success) smsCount = res.SentCount;
            }

            lock (_syncLock)
            {
                step.Status = "DISPATCHED";
                step.DispatchedAt = now;
                step.RecipientCount = memberIds.Count;
                step.SmsCount = smsCount;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to dispatch campaign step {Level}: {Title}", step.Level, step.Title);
            lock (_syncLock)
            {
                step.Status = "FAILED";
                step.DispatchedAt = DateTime.UtcNow;
            }
        }
    }

    public List<CampaignPresetDto> GetPresets()
    {
        return new List<CampaignPresetDto>
        {
            new()
            {
                Id = "SUNDAY_COUNTDOWN",
                Name = "Sunday Service Countdown (3 Levels)",
                Description = "Dispatches progressive reminders 15m, 10m, and 5m before worship begins.",
                DefaultIntervalMinutes = 5,
                DefaultSendTo = "ALL",
                Steps = new List<CampaignStepInput>
                {
                    new()
                    {
                        Level = 1,
                        Title = "Sunday Worship in 15 Minutes!",
                        Message = "Good morning church family! Prepare your hearts as we get ready to enter His gates with thanksgiving. Find your seat in the sanctuary."
                    },
                    new()
                    {
                        Level = 2,
                        Title = "Praise & Worship Team on Stage",
                        Message = "'Come, let us bow down in worship, let us kneel before the Lord our Maker.' (Psalm 95:6). Worship is about to begin!"
                    },
                    new()
                    {
                        Level = 3,
                        Title = "FINAL CALL: Doors Closing • Livestream Live",
                        Message = "Opening prayer has started! If joining online, tune in now at epicchurch.org/live. God has a word for you today!"
                    }
                }
            },
            new()
            {
                Id = "REVIVAL_PRAYER",
                Name = "Revival & Prayer Vigil Drip (3 Levels)",
                Description = "Step-by-step spiritual boost across prayer hours (Heart check, Scripture fuel, Assembly alert).",
                DefaultIntervalMinutes = 10,
                DefaultSendTo = "ALL",
                Steps = new List<CampaignStepInput>
                {
                    new()
                    {
                        Level = 1,
                        Title = "Prayer Vigil: Heart Surrender & Fasting",
                        Message = "Beloved, take 5 minutes now to pause, disconnect from worldly noise, and invite the Holy Spirit to minister to your family."
                    },
                    new()
                    {
                        Level = 2,
                        Title = "Midway Word: Faith & Breakthrough",
                        Message = "'The Lord is my strength and my shield; my heart trusted in him, and I am helped.' (Psalm 28:7). Stand firm, breakthrough is coming!"
                    },
                    new()
                    {
                        Level = 3,
                        Title = "Corporate Assembly Tonight @ Sanctuary",
                        Message = "Bring your burdens and your loved ones. The Holy Spirit is moving tonight in our corporate prayer rally. Doors open at 6:30 PM!"
                    }
                }
            },
            new()
            {
                Id = "YOUTH_HYPE",
                Name = "Youth Ministry Rally & Fellowship (3 Levels)",
                Description = "Hype sequence for youth and young adults before ministry activities.",
                DefaultIntervalMinutes = 5,
                DefaultSendTo = "YOUTH,YOUNG_ADULT",
                Steps = new List<CampaignStepInput>
                {
                    new()
                    {
                        Level = 1,
                        Title = "Youth Alive: Meetup at Church Plaza",
                        Message = "Hey EPIC Youth! Shuttles and vans are loading now at the plaza gate. Wear your ministry shirts and bring your friends!"
                    },
                    new()
                    {
                        Level = 2,
                        Title = "Pre-Service Games & Icebreakers Starting",
                        Message = "Rally games are kicking off in the youth fellowship hall. Exciting prizes await the loudest and most energetic team!"
                    },
                    new()
                    {
                        Level = 3,
                        Title = "Encounter Night Starting Now • Lights Dimming",
                        Message = "Grab your seats up front! God is going to do something incredible in our generation tonight. Let's worship!"
                    }
                }
            },
            new()
            {
                Id = "MINISTRY_CALL",
                Name = "Worship & Tech Team Call-Times (3 Levels)",
                Description = "Structured rehearsal and technical run-throughs for serving volunteers.",
                DefaultIntervalMinutes = 5,
                DefaultSendTo = "WORSHIP,MEDIA",
                Steps = new List<CampaignStepInput>
                {
                    new()
                    {
                        Level = 1,
                        Title = "Stage Sound Check & Video Calibration",
                        Message = "Sound engineers and media team: mic line checks and video switcher calibration starting on main stage."
                    },
                    new()
                    {
                        Level = 2,
                        Title = "Vocal Warmups & In-Ear Monitor Check",
                        Message = "Singers and band members: please plug in your in-ear monitors. Vocal warmups with the worship director."
                    },
                    new()
                    {
                        Level = 3,
                        Title = "Full Run-Through & Pre-Service Prayer",
                        Message = "Musicians, media, and ushers: gathering in the green room for pre-service prayer and blessings with Pastor."
                    }
                }
            }
        };
    }

    public void Dispose()
    {
        StopInternalAsync().GetAwaiter().GetResult();
    }
}
