using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Services;

public sealed class MemberNotificationWorker(IServiceScopeFactory scopes, IHttpClientFactory clients,
    IConfiguration configuration, ILogger<MemberNotificationWorker> logger, NotificationWakeSignal? wake = null) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PublishDueAnnouncements(stoppingToken);
                await ExpandInbox(stoppingToken);
                if (configuration.GetValue<bool>("PushNotifications:Enabled", true)) await Deliver(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogError(exception, "Notification worker cycle failed; saved work will be retried."); }
            try { if (wake == null) await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken); else await wake.Wait(stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task PublishDueAnnouncements(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTime.UtcNow;
        var ids = await db.Announcements.AsNoTracking().Where(a => a.IsPublished && a.PublishDate <= now && a.PushQueuedAt == null)
            .OrderBy(a => a.PublishDate).Take(20).Select(a => a.Id).ToListAsync(ct);
        foreach (var id in ids)
        {
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            if (await db.Announcements.Where(a => a.Id == id && a.IsPublished && a.PublishDate <= now && a.PushQueuedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.PushQueuedAt, now), ct) != 1) continue;
            var announcement = await db.Announcements.AsNoTracking().SingleAsync(a => a.Id == id, ct);
            // Announcements in the existing schema are church-wide/public, not tenant-targeted.
            var members = await db.Users.Where(u => u.IsActive && u.MemberId != null && u.Role != null && u.Role.RoleName == "MEMBER" &&
                u.Member != null && u.Member.Status == "ACTIVE").Select(u => u.MemberId!.Value).Distinct().ToListAsync(ct);
            var body = System.Net.WebUtility.HtmlDecode(System.Text.RegularExpressions.Regex.Replace(announcement.Content, "<[^>]*>", " "));
            foreach (var memberId in members) db.MemberNotifications.Add(new() {
                MemberId = memberId, Kind = "ANNOUNCEMENT", AnnouncementId = id, ReferenceId = id,
                Title = announcement.Title.Length > 200 ? announcement.Title[..200] : announcement.Title,
                Body = body.Length > 2000 ? body[..1997] + "..." : body
            });
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            db.ChangeTracker.Clear();
        }
    }

    private async Task ExpandInbox(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var ids = await db.MemberNotifications.Where(n => n.ExpandedAt == null).OrderBy(n => n.CreatedAt)
            .Take(100).Select(n => n.Id).ToListAsync(ct);
        foreach (var id in ids)
        {
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            if (await db.MemberNotifications.Where(n => n.Id == id && n.ExpandedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.ExpandedAt, DateTime.UtcNow), ct) != 1) continue;
            var memberId = await db.MemberNotifications.Where(n => n.Id == id).Select(n => n.MemberId).SingleAsync(ct);
            var devices = await db.PushDevices.Where(d => d.MemberId == memberId && d.IsActive).Select(d => d.Id).ToListAsync(ct);
            foreach (var deviceId in devices) db.PushDeliveries.Add(new() { NotificationId = id, DeviceId = deviceId });
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            db.ChangeTracker.Clear();
        }
    }

    private async Task Deliver(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTime.UtcNow;
        var ids = await db.PushDeliveries.Where(d => (d.State == "PENDING" || d.State == "TICKET") && d.NextAttemptAt <= now &&
            (d.LeaseUntil == null || d.LeaseUntil < now)).OrderBy(d => d.NextAttemptAt).Take(50).Select(d => d.Id).ToListAsync(ct);
        foreach (var id in ids)
        {
            if (await db.PushDeliveries.Where(d => d.Id == id && (d.State == "PENDING" || d.State == "TICKET") &&
                (d.LeaseUntil == null || d.LeaseUntil < now)).ExecuteUpdateAsync(s => s.SetProperty(d => d.LeaseUntil, now.AddMinutes(2)), ct) != 1) continue;
            var delivery = await db.PushDeliveries.SingleAsync(d => d.Id == id, ct);
            var notice = await db.MemberNotifications.AsNoTracking().SingleAsync(n => n.Id == delivery.NotificationId, ct);
            var device = await db.PushDevices.SingleOrDefaultAsync(d => d.Id == delivery.DeviceId, ct);
            var eligible = device != null && device.IsActive && device.MemberId == notice.MemberId &&
                await db.Users.AnyAsync(u => u.IsActive && u.MemberId == notice.MemberId && u.Role != null && u.Role.RoleName == "MEMBER" &&
                    u.Member != null && u.Member.Status == "ACTIVE", ct);
            if (notice.AnnouncementId.HasValue) eligible &= await db.Announcements.AnyAsync(a => a.Id == notice.AnnouncementId && a.IsPublished && a.PublishDate <= DateTime.UtcNow, ct);
            if (notice.Kind == "CHAT") eligible &= await db.ChatMemberships.AnyAsync(m => m.RoomId == notice.ReferenceId && m.MemberId == notice.MemberId && m.IsActive && m.JoinedAt <= notice.CreatedAt, ct);
            if (!eligible) delivery.State = "SKIPPED";
            else
            {
                try
                {
                    var client = clients.CreateClient("ExpoPush");
                    var receipt = delivery.State == "TICKET";
                    using var request = new HttpRequestMessage(HttpMethod.Post, receipt ? "getReceipts" : "send");
                    var accessToken = configuration["PushNotifications:AccessToken"];
                    if (!string.IsNullOrWhiteSpace(accessToken)) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                    request.Content = receipt ? JsonContent.Create(new { ids = new[] { delivery.TicketId } }) : JsonContent.Create(new {
                        to = device!.Token,
                        title = string.IsNullOrWhiteSpace(notice.Title) ? "EPIC Church" : notice.Title,
                        sound = "default",
                        priority = "high",
                        channelId = "epic-updates",
                        body = notice.Kind == "CHAT"
                            ? "You have a new chat message. Open EPIC to read it."
                            : (string.IsNullOrWhiteSpace(notice.Body) ? "A church update is available. Open EPIC to read it." : notice.Body),
                        data = new {
                            notificationId = notice.Id,
                            memberId = notice.MemberId,
                            kind = notice.Kind,
                            roomId = notice.Kind == "CHAT" ? notice.ReferenceId : null,
                            title = notice.Title,
                            body = notice.Body
                        }
                    });
                    using var response = await client.SendAsync(request, ct);
                    if (!response.IsSuccessStatusCode)
                    {
                        if ((int)response.StatusCode == 429 || (int)response.StatusCode >= 500) Retry(delivery, "HTTP_" + (int)response.StatusCode);
                        else { delivery.State = "FAILED"; delivery.ErrorCode = "HTTP_" + (int)response.StatusCode; }
                    }
                    else
                    {
                        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
                        var data = json.RootElement.GetProperty("data");
                        if (receipt)
                        {
                            if (!data.TryGetProperty(delivery.TicketId!, out var item))
                            {
                                if (DateTime.UtcNow - delivery.CreatedAt > TimeSpan.FromHours(24)) { delivery.State = "FAILED"; delivery.ErrorCode = "RECEIPT_EXPIRED"; }
                                else delivery.NextAttemptAt = DateTime.UtcNow.AddMinutes(15);
                            }
                            else ApplyExpoResult(delivery, device!, item, true);
                        }
                        else ApplyExpoResult(delivery, device!, data.ValueKind == JsonValueKind.Array ? data[0] : data, false);
                    }
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException or JsonException or InvalidOperationException or KeyNotFoundException)
                { Retry(delivery, "TRANSPORT_OR_RESPONSE"); }
            }
            delivery.LeaseUntil = null;
            await db.SaveChangesAsync(ct);
            db.ChangeTracker.Clear();
        }
    }

    internal static void Retry(PushDelivery delivery, string code)
    {
        delivery.ErrorCode = code;
        delivery.Attempts++;
        if (delivery.Attempts >= 8) delivery.State = "FAILED";
        else delivery.NextAttemptAt = DateTime.UtcNow.AddSeconds(Math.Min(3600, 15 * Math.Pow(2, delivery.Attempts)));
    }

    internal static void ApplyExpoResult(PushDelivery delivery, PushDevice device, JsonElement item, bool receipt)
    {
        if (item.GetProperty("status").GetString() == "ok")
        {
            delivery.ErrorCode = null;
            if (receipt) delivery.State = "ACCEPTED"; // Provider acceptance does not guarantee display on the phone.
            else { delivery.TicketId = item.GetProperty("id").GetString(); delivery.State = "TICKET"; delivery.NextAttemptAt = DateTime.UtcNow.AddMinutes(15); }
            return;
        }
        var code = item.TryGetProperty("details", out var details) && details.TryGetProperty("error", out var error) ? error.GetString() ?? "UNKNOWN" : "UNKNOWN";
        if (code == "MessageRateExceeded") { delivery.State = "PENDING"; delivery.TicketId = null; Retry(delivery, code); return; }
        delivery.State = "FAILED";
        delivery.ErrorCode = code;
        if (code == "DeviceNotRegistered") device.IsActive = false;
    }
}
