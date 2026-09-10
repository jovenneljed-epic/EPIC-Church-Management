using System.Collections.Concurrent;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Services;

public class DailyReminderItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public string TimeOfDay { get; set; } = "06:00 AM";
    public int Hour { get; set; } = 6; // 0-23 (in UTC+8)
    public int Minute { get; set; } = 0; // 0-59
    public string Frequency { get; set; } = "DAILY"; // DAILY, WEEKDAYS, WEEKENDS, CUSTOM
    public List<int> DaysOfWeek { get; set; } = new() { 0, 1, 2, 3, 4, 5, 6 }; // 0=Sunday, 1=Monday...
    public string SendTo { get; set; } = "ALL";
    public bool SendPush { get; set; } = true;
    public bool SendSms { get; set; } = false;
    public bool IsEnabled { get; set; } = true;
    public DateTime? LastDispatchedAt { get; set; }
    public int LastRecipientCount { get; set; } = 0;
    public int LastSmsCount { get; set; } = 0;
}

public interface IDailyReminderService
{
    List<DailyReminderItem> GetAll();
    DailyReminderItem Upsert(DailyReminderItem item);
    bool Delete(string id);
    DailyReminderItem? Toggle(string id);
    Task<DailyReminderItem?> TriggerNowAsync(string id);
}

public sealed class DailyReminderService : BackgroundService, IDailyReminderService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly NotificationWakeSignal? _wake;
    private readonly ILogger<DailyReminderService> _logger;

    private readonly object _syncLock = new();
    private readonly ConcurrentDictionary<string, DailyReminderItem> _reminders = new();
    private readonly ConcurrentDictionary<string, string> _lastDispatchedMinute = new();

    public DailyReminderService(
        IServiceScopeFactory scopeFactory,
        ILogger<DailyReminderService> logger,
        NotificationWakeSignal? wake = null)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _wake = wake;

        // Seed default daily church reminders
        SeedDefaultReminders();
    }

    private void SeedDefaultReminders()
    {
        var defaults = new List<DailyReminderItem>
        {
            new()
            {
                Id = "DEF-MORNING-DEVOTION",
                Title = "🌅 Morning Word & Family Devotion",
                Message = "Good morning church family! 'This is the day the Lord has made; let us rejoice and be glad in it.' - Psalm 118:24. Walk in His divine grace today!",
                TimeOfDay = "06:00 AM",
                Hour = 6,
                Minute = 0,
                Frequency = "DAILY",
                DaysOfWeek = new() { 0, 1, 2, 3, 4, 5, 6 },
                SendTo = "ALL",
                SendPush = true,
                SendSms = false,
                IsEnabled = true
            },
            new()
            {
                Id = "DEF-MIDDAY-PRAYER",
                Title = "☀️ Midday 1-Minute Prayer Pause",
                Message = "Take 60 seconds wherever you are to breathe, surrender your worries, and invite God's peace into your afternoon tasks. He cares for you!",
                TimeOfDay = "12:00 PM",
                Hour = 12,
                Minute = 0,
                Frequency = "WEEKDAYS",
                DaysOfWeek = new() { 1, 2, 3, 4, 5 },
                SendTo = "ALL",
                SendPush = true,
                SendSms = false,
                IsEnabled = false
            },
            new()
            {
                Id = "DEF-EVENING-BLESSING",
                Title = "🌙 Evening Family Blessing & Gratitude",
                Message = "As your day comes to a close: count three blessings from today, pray over your children, and sleep in the shelter of the Most High. Good night!",
                TimeOfDay = "08:00 PM",
                Hour = 20,
                Minute = 0,
                Frequency = "DAILY",
                DaysOfWeek = new() { 0, 1, 2, 3, 4, 5, 6 },
                SendTo = "ALL",
                SendPush = true,
                SendSms = false,
                IsEnabled = true
            },
            new()
            {
                Id = "DEF-SUNDAY-ALERT",
                Title = "⛪ Sunday Worship Reminder (Tomorrow at 9:00 AM!)",
                Message = "Sunday Service is tomorrow! Prepare your hearts, set your alarms, and invite a friend or neighbor to join us in God's presence.",
                TimeOfDay = "07:00 PM",
                Hour = 19,
                Minute = 0,
                Frequency = "CUSTOM",
                DaysOfWeek = new() { 6 }, // Saturday evening
                SendTo = "ALL",
                SendPush = true,
                SendSms = false,
                IsEnabled = true
            }
        };

        foreach (var d in defaults)
        {
            _reminders.TryAdd(d.Id, d);
        }
    }

    public List<DailyReminderItem> GetAll()
    {
        return _reminders.Values
            .OrderBy(r => r.Hour)
            .ThenBy(r => r.Minute)
            .ToList();
    }

    public DailyReminderItem Upsert(DailyReminderItem item)
    {
        if (string.IsNullOrWhiteSpace(item.Id))
        {
            item.Id = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        }

        item.Title = item.Title?.Trim() ?? "Daily Reminder";
        item.Message = item.Message?.Trim() ?? "";
        item.Hour = Math.Clamp(item.Hour, 0, 23);
        item.Minute = Math.Clamp(item.Minute, 0, 59);

        // Format TimeOfDay
        var dt = new DateTime(2026, 1, 1, item.Hour, item.Minute, 0);
        item.TimeOfDay = dt.ToString("hh:mm tt");

        _reminders[item.Id] = item;
        _logger.LogInformation("Daily reminder {Id} ('{Title}') saved for {Time}", item.Id, item.Title, item.TimeOfDay);
        return item;
    }

    public bool Delete(string id)
    {
        var removed = _reminders.TryRemove(id, out _);
        _lastDispatchedMinute.TryRemove(id, out _);
        return removed;
    }

    public DailyReminderItem? Toggle(string id)
    {
        if (_reminders.TryGetValue(id, out var item))
        {
            item.IsEnabled = !item.IsEnabled;
            return item;
        }
        return null;
    }

    public async Task<DailyReminderItem?> TriggerNowAsync(string id)
    {
        if (_reminders.TryGetValue(id, out var item))
        {
            await DispatchReminderAsync(item);
            return item;
        }
        return null;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DailyReminderService background worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndDispatchDueRemindersAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking daily reminders.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task CheckAndDispatchDueRemindersAsync()
    {
        // Local Philippine Time (UTC+8)
        var localNow = DateTime.UtcNow.AddHours(8);
        var currentHour = localNow.Hour;
        var currentMinute = localNow.Minute;
        var currentDayOfWeek = (int)localNow.DayOfWeek; // 0 = Sunday, 1 = Monday...
        var minuteKey = localNow.ToString("yyyyMMdd_HHmm");

        foreach (var reminder in _reminders.Values)
        {
            if (!reminder.IsEnabled) continue;

            // Check if day matches
            bool dayMatches = reminder.Frequency switch
            {
                "DAILY" => true,
                "WEEKDAYS" => currentDayOfWeek >= 1 && currentDayOfWeek <= 5,
                "WEEKENDS" => currentDayOfWeek == 0 || currentDayOfWeek == 6,
                "CUSTOM" => reminder.DaysOfWeek != null && reminder.DaysOfWeek.Contains(currentDayOfWeek),
                _ => true
            };

            if (!dayMatches) continue;

            // Check if time matches
            if (reminder.Hour == currentHour && reminder.Minute == currentMinute)
            {
                // Ensure not already dispatched in this same minute
                if (_lastDispatchedMinute.TryGetValue(reminder.Id, out var lastMin) && lastMin == minuteKey)
                {
                    continue;
                }

                _lastDispatchedMinute[reminder.Id] = minuteKey;
                _logger.LogInformation("Triggering scheduled daily reminder {Id}: '{Title}' at {Time}", reminder.Id, reminder.Title, reminder.TimeOfDay);
                await DispatchReminderAsync(reminder);
            }
        }
    }

    private async Task DispatchReminderAsync(DailyReminderItem reminder)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var smsGateway = scope.ServiceProvider.GetRequiredService<ISmsGatewayService>();

            var now = DateTime.UtcNow;

            // 1. Create Announcement record
            var announcement = new Announcement
            {
                Title = reminder.Title,
                Content = reminder.Message,
                Category = "DAILY_REMINDER",
                IsPublished = true,
                PublishDate = now,
                CreatedDate = now,
                PushQueuedAt = now
            };

            db.Announcements.Add(announcement);
            await db.SaveChangesAsync();

            // 2. Resolve eligible active members
            var allEligibleQuery = db.Users
                .Where(u => u.IsActive && u.MemberId != null &&
                            u.Member != null && u.Member.Status == "ACTIVE");

            List<int> memberIds;
            var sendTo = reminder.SendTo ?? "ALL";

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
            if (reminder.SendPush)
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
            if (reminder.SendSms && smsGateway.IsConfigured)
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

            reminder.LastDispatchedAt = now;
            reminder.LastRecipientCount = memberIds.Count;
            reminder.LastSmsCount = smsCount;

            _logger.LogInformation("Daily reminder {Id} dispatched to {Rec} members ({Sms} SMS).", reminder.Id, memberIds.Count, smsCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to dispatch daily reminder {Id}", reminder.Id);
        }
    }
}
