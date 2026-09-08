using System.Security.Claims;
using System.Text.RegularExpressions;
using EPIC.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers;

[ApiController, Authorize, Route("api/MemberNotifications")]
public class MemberNotificationsController(ApplicationDbContext context) : ControllerBase
{
    private async Task<int?> MemberId()
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return null;
        return await context.Users.Where(u => u.UserId == userId && u.IsActive && u.Role != null &&
            u.Role.RoleName == "MEMBER" && u.Member != null && u.Member.Status == "ACTIVE")
            .Select(u => u.MemberId).FirstOrDefaultAsync();
    }

    [HttpGet]
    public async Task<IActionResult> Inbox(int skip = 0)
    {
        var memberId = await MemberId();
        if (memberId == null) return Forbid();
        var now = DateTime.UtcNow;
        var query = context.MemberNotifications.AsNoTracking().Where(n => n.MemberId == memberId && n.Kind != "CHAT" &&
            (n.AnnouncementId == null || context.Announcements.Any(a => a.Id == n.AnnouncementId && a.IsPublished && a.PublishDate <= now)) &&
            (n.Kind != "CHAT" || context.ChatMemberships.Any(m => m.RoomId == n.ReferenceId && m.MemberId == memberId && m.IsActive && m.JoinedAt <= n.CreatedAt)));
        return Ok(new { unread = await query.CountAsync(n => n.ReadAt == null),
            notifications = await query.OrderByDescending(n => n.CreatedAt).ThenBy(n => n.Id)
                .Skip(Math.Max(0, skip)).Take(50).Select(n => new { n.Id, n.Kind, n.Title, n.Body, n.ReferenceId, n.CreatedAt, n.ReadAt }).ToListAsync() });
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> Read(Guid id)
    {
        var memberId = await MemberId();
        if (memberId == null) return Forbid();
        await context.MemberNotifications.Where(n => n.Id == id && n.MemberId == memberId && n.ReadAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadAt, DateTime.UtcNow));
        return NoContent();
    }

    public record DeviceRequest(string Token);

    public record AttendanceItem(string RecordKey, int AttendanceId, int MemberId, int? ChurchServiceId,
        int? EventId, DateTime AttendanceDate, string ServiceName, string Status, string RecordedBy, DateTime RecordedDate);

    [HttpGet("attendance")]
    public async Task<IActionResult> AttendanceHistory()
    {
        var memberId = await MemberId();
        if (memberId == null) return Forbid();
        var church = await context.Attendances.AsNoTracking().Where(a => a.MemberId == memberId)
            .Select(a => new AttendanceItem("church:" + a.AttendanceId, a.AttendanceId, a.MemberId, a.ChurchServiceId, a.EventId,
                a.AttendanceDate, a.ChurchService != null ? a.ChurchService.ServiceName : a.Service, a.Status, a.RecordedBy, a.RecordedDate)).ToListAsync();
        var events = await context.EventAttendances.AsNoTracking().Where(a => a.MemberId == memberId)
            .Select(a => new AttendanceItem("event:" + a.EventAttendanceId, a.EventAttendanceId, a.MemberId, null, a.EventId,
                a.AttendanceDate, a.Event != null ? a.Event.Title : "Event attendance", a.Status, a.RecordedBy, a.RecordedDate)).ToListAsync();
        // Prefer the dedicated event record over legacy attendance rows for the same event.
        var eventIds = events.Select(a => a.EventId).ToHashSet();
        var records = church.Where(a => a.EventId == null || !eventIds.Contains(a.EventId)).Concat(events)
            .OrderByDescending(a => a.AttendanceDate).ToList();
        return Ok(new { memberId, attendance = records, summary = new {
            total = records.Count, present = records.Count(a => a.Status == "PRESENT"), early = records.Count(a => a.Status == "EARLY"),
            late = records.Count(a => a.Status == "LATE"), absent = records.Count(a => a.Status == "ABSENT"), excused = records.Count(a => a.Status == "EXCUSED")
        } });
    }

    [HttpPost("devices")]
    public async Task<IActionResult> Register(DeviceRequest request)
    {
        var memberId = await MemberId();
        if (memberId == null) return Forbid();
        if (request.Token == null || request.Token.Length > 200 || !Regex.IsMatch(request.Token, @"^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$"))
            return BadRequest(new { message = "Invalid Expo push token." });
        // Serializes ownership changes for this token across API instances.
        await using var transaction = await context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var device = await context.PushDevices.SingleOrDefaultAsync(d => d.Token == request.Token);
        if (device == null) { device = new() { Token = request.Token }; context.PushDevices.Add(device); }
        device.MemberId = memberId.Value;
        device.IsActive = true;
        device.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { registered = true });
    }

    [HttpPost("devices/remove")]
    public async Task<IActionResult> Remove(DeviceRequest request)
    {
        var memberId = await MemberId();
        if (memberId == null) return Forbid();
        await context.PushDevices.Where(d => d.Token == request.Token && d.MemberId == memberId)
            .ExecuteUpdateAsync(s => s.SetProperty(d => d.IsActive, false));
        return NoContent();
    }
}
