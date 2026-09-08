using System.Security.Claims;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Controllers;

[ApiController, Authorize, Route("api/Chat")]
public class ChatController(ApplicationDbContext db, IHubContext<ChatHub> hub, NotificationWakeSignal wake) : ControllerBase
{
    private async Task<User?> Actor() {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId"), out var id)) return null;
        return await db.Users.AsNoTracking().Include(u => u.Role).Include(u => u.Member).FirstOrDefaultAsync(u => u.UserId == id && u.IsActive);
    }
    private static bool Admin(User u, int customerId) => u.Role?.RoleName == "ADMIN" && (u.CustomerId == null || u.CustomerId == customerId);
    private async Task<bool> CanRead(User u, ChatRoom r) => Admin(u, r.CustomerId) || (u.Member?.Status == "ACTIVE" && u.Member.CustomerId == r.CustomerId && await db.ChatMemberships.AnyAsync(m => m.RoomId == r.Id && m.MemberId == u.MemberId && m.IsActive));
    private async Task<bool> CanManage(User u, ChatRoom r) => Admin(u, r.CustomerId) || (await CanRead(u, r) && await db.ChatMemberships.AnyAsync(m => m.RoomId == r.Id && m.MemberId == u.MemberId && m.IsActive && m.IsManager));
    private Task Lock(int roomId) {
        var key = $"EPIC:CHAT:{roomId}";
        return db.Database.ExecuteSqlInterpolatedAsync($@"DECLARE @r int; EXEC @r=sp_getapplock @Resource={key}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; IF @r < 0 THROW 51000, 'Chat is busy. Please retry.', 1;");
    }
    private async Task Changed(int roomId, int? extraMemberId = null) {
        var members = db.ChatMemberships.Where(m => m.RoomId == roomId && m.IsActive).Select(m => m.MemberId);
        var ids = await db.Users.Where(u => u.IsActive && u.MemberId != null && (members.Contains(u.MemberId.Value) || u.MemberId == extraMemberId)).Select(u => u.UserId.ToString()).ToListAsync();
        try { await hub.Clients.Users(ids).SendAsync("ChatChanged", new { roomId }); } catch { /* Durable inbox and reconnect refresh recover missed invalidations. */ }
    }
    [HttpGet("rooms")]
    public async Task<IActionResult> Rooms() {
        var u = await Actor(); if (u == null) return Forbid();
        var admin = u.Role?.RoleName == "ADMIN";
        var rooms = await db.ChatRooms.AsNoTracking().Where(r => (admin && (u.CustomerId == null || r.CustomerId == u.CustomerId)) ||
            (u.Member != null && u.Member.Status == "ACTIVE" && r.CustomerId == u.Member.CustomerId && db.ChatMemberships.Any(m => m.RoomId == r.Id && m.MemberId == u.MemberId && m.IsActive)))
            .OrderBy(r => r.Category).ThenBy(r => r.Name).ToListAsync();
        var memberships = await db.ChatMemberships.AsNoTracking().Where(m => m.MemberId == u.MemberId && m.IsActive).ToListAsync();
        var list = new List<object>();
        foreach (var r in rooms) { var m = memberships.FirstOrDefault(x => x.RoomId == r.Id); var after = Math.Max(m?.LastReadMessageId ?? 0, m?.JoinedAfterMessageId ?? 0);
            var unread = m == null ? 0 : await db.ChatMessages.CountAsync(msg => msg.RoomId == r.Id && msg.Id > after && msg.SenderUserId != u.UserId);
            list.Add(new { r.Id, r.Name, r.Category, r.CustomerId, unread, joinedAfterMessageId = Admin(u, r.CustomerId) ? 0 : m?.JoinedAfterMessageId ?? 0, canManage = Admin(u, r.CustomerId) || m?.IsManager == true }); }
        return Ok(new { canCreate = admin, rooms = list });
    }
    [HttpGet("options")]
    public async Task<IActionResult> Options() {
        var u = await Actor(); if (u?.Role?.RoleName != "ADMIN") return Forbid();
        return Ok(new { customers = await db.Customers.AsNoTracking().Where(c => u.CustomerId == null || c.CustomerId == u.CustomerId).Select(c => new { c.CustomerId, name = c.ChurchName }).ToListAsync(),
            ministries = await db.Ministries.AsNoTracking().Where(m => m.Status == "ACTIVE" && (u.CustomerId == null || m.CustomerId == u.CustomerId)).Select(m => new { m.MinistryId, m.CustomerId, m.Name }).ToListAsync() });
    }
    public record CreateRoom(int CustomerId, string Category, string Name, int? MinistryId);
    [HttpPost("rooms")]
    public async Task<IActionResult> Create(CreateRoom request) {
        var u = await Actor(); if (u == null || !Admin(u, request.CustomerId)) return Forbid();
        var category = request.Category?.Trim().ToUpperInvariant(); var name = request.Name?.Trim();
        if (category is not ("MINISTRY" or "DEPARTMENT" or "GROUP") || string.IsNullOrWhiteSpace(name) || name.Length > 120) return BadRequest(new { message = "Choose a category and a room name up to 120 characters." });
        if (!await db.Customers.AnyAsync(c => c.CustomerId == request.CustomerId)) return NotFound();
        if (category == "MINISTRY" && !await db.Ministries.AnyAsync(m => m.MinistryId == request.MinistryId && m.CustomerId == request.CustomerId && m.Status == "ACTIVE")) return BadRequest(new { message = "Choose an active ministry in this church." });
        await using var tx = await db.Database.BeginTransactionAsync();
        await Lock(-request.CustomerId);
        var existingRoom = await db.ChatRooms.SingleOrDefaultAsync(r => r.CustomerId == request.CustomerId && r.Category == category && r.Name == name);
        if (existingRoom != null) return Ok(new { existingRoom.Id });
        var room = new ChatRoom { CustomerId = request.CustomerId, Category = category, Name = name, MinistryId = category == "MINISTRY" ? request.MinistryId : null, CreatedByUserId = u.UserId };
        db.ChatRooms.Add(room); await db.SaveChangesAsync();
        var memberIds = category == "MINISTRY" ? await db.MinistryMembers.Where(m => m.MinistryId == request.MinistryId && m.Status == "ACTIVE" && m.Member != null && m.Member.Status == "ACTIVE" && m.Member.CustomerId == request.CustomerId).Select(m => m.MemberId).Distinct().ToListAsync() : [];
        foreach (var memberId in memberIds) db.ChatMemberships.Add(new ChatMembership { RoomId = room.Id, MemberId = memberId });
        await db.SaveChangesAsync(); await tx.CommitAsync(); await Changed(room.Id);
        return Ok(new { room.Id });
    }
    [HttpGet("rooms/{roomId:int}/members")]
    public async Task<IActionResult> Members(int roomId, string search = "") {
        var u = await Actor(); var r = await db.ChatRooms.FindAsync(roomId); if (u == null || r == null || !await CanManage(u, r)) return Forbid();
        var roster = await db.ChatMemberships.AsNoTracking().Where(m => m.RoomId == roomId && m.IsActive).ToListAsync();
        var ids = roster.Select(m => m.MemberId).ToList();
        var members = await db.Members.AsNoTracking().Where(m => m.CustomerId == r.CustomerId && (ids.Contains(m.MemberId) || m.Status == "ACTIVE") && (search == "" || m.FirstName.Contains(search) || m.LastName.Contains(search) || m.MemberCode.Contains(search)))
            .OrderByDescending(m => ids.Contains(m.MemberId)).ThenBy(m => m.LastName).Take(200).Select(m => new { m.MemberId, m.FirstName, m.LastName, m.MemberCode }).ToListAsync();
        return Ok(new { canAssignManager = Admin(u, r.CustomerId), members = members.Select(m => new { m.MemberId, name = m.FirstName + " " + m.LastName, m.MemberCode, isJoined = ids.Contains(m.MemberId), isManager = roster.Any(x => x.MemberId == m.MemberId && x.IsManager) }) });
    }
    public record MembershipRequest(bool IsManager = false);
    [HttpPut("rooms/{roomId:int}/members/{memberId:int}")]
    public async Task<IActionResult> AddMember(int roomId, int memberId, MembershipRequest request) => await Membership(roomId, memberId, true, request.IsManager);
    [HttpDelete("rooms/{roomId:int}/members/{memberId:int}")]
    public async Task<IActionResult> RemoveMember(int roomId, int memberId) => await Membership(roomId, memberId, false, false);
    private async Task<IActionResult> Membership(int roomId, int memberId, bool active, bool manager) {
        var u = await Actor(); if (u == null) return Forbid();
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(roomId);
        var r = await db.ChatRooms.FindAsync(roomId); if (r == null || !await CanManage(u, r)) return Forbid();
        var m = await db.ChatMemberships.SingleOrDefaultAsync(x => x.RoomId == roomId && x.MemberId == memberId);
        if (!Admin(u, r.CustomerId) && (manager || m?.IsManager == true)) return Forbid();
        if (!await db.Members.AnyAsync(x => x.MemberId == memberId && x.CustomerId == r.CustomerId && (!active || x.Status == "ACTIVE"))) return BadRequest(new { message = "Choose an eligible member of this church." });
        if (m == null && !active) return NoContent();
        var last = await db.ChatMessages.Where(x => x.RoomId == roomId).MaxAsync(x => (long?)x.Id) ?? 0;
        if (m == null) { m = new ChatMembership { RoomId = roomId, MemberId = memberId, JoinedAfterMessageId = last, LastReadMessageId = last }; db.ChatMemberships.Add(m); }
        else if (!m.IsActive && active) { m.JoinedAfterMessageId = last; m.LastReadMessageId = last; m.JoinedAt = DateTime.UtcNow; }
        m.IsActive = active; m.IsManager = active && manager;
        await db.SaveChangesAsync(); await tx.CommitAsync(); await Changed(roomId, memberId); return NoContent();
    }
    [HttpGet("rooms/{roomId:int}/messages")]
    public async Task<IActionResult> Messages(int roomId, long before = 0) {
        var u = await Actor(); var r = await db.ChatRooms.FindAsync(roomId); if (u == null || r == null || !await CanRead(u, r)) return Forbid();
        var membership = await db.ChatMemberships.AsNoTracking().SingleOrDefaultAsync(m => m.RoomId == roomId && m.MemberId == u.MemberId && m.IsActive);
        var since = Admin(u, r.CustomerId) ? 0 : membership!.JoinedAfterMessageId;
        var messages = await db.ChatMessages.AsNoTracking().Where(m => m.RoomId == roomId && m.Id > since && (before == 0 || m.Id < before)).OrderByDescending(m => m.Id).Take(50)
            .Select(m => new { m.Id, m.Body, m.SenderName, m.CreatedAt, isMine = m.SenderUserId == u.UserId }).ToListAsync();
        return Ok(messages.OrderBy(m => m.Id));
    }
    public record SendRequest(string Body, string ClientMessageId);
    [HttpPost("rooms/{roomId:int}/messages")]
    public async Task<IActionResult> Send(int roomId, SendRequest request) {
        var u = await Actor(); if (u == null) return Forbid();
        var body = request.Body?.Trim();
        if (string.IsNullOrWhiteSpace(body) || body.Length > 2000 || string.IsNullOrWhiteSpace(request.ClientMessageId) || request.ClientMessageId.Length > 80) return BadRequest(new { message = "Write a message between 1 and 2,000 characters." });
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(roomId);
        var r = await db.ChatRooms.FindAsync(roomId); if (r == null || !await CanRead(u, r)) return Forbid();
        var existing = await db.ChatMessages.SingleOrDefaultAsync(m => m.RoomId == roomId && m.SenderUserId == u.UserId && m.ClientMessageId == request.ClientMessageId);
        if (existing != null) return existing.Body == body ? Ok(new { existing.Id }) : Conflict(new { message = "This retry ID belongs to another message." });
        var since = DateTime.UtcNow.AddMinutes(-1);
        if (await db.ChatMessages.CountAsync(m => m.RoomId == roomId && m.SenderUserId == u.UserId && m.CreatedAt >= since) >= 30) return StatusCode(429, new { message = "Please wait a moment before sending more messages." });
        var msg = new ChatMessage { RoomId = roomId, SenderUserId = u.UserId, SenderName = u.FullName, Body = body, ClientMessageId = request.ClientMessageId };
        db.ChatMessages.Add(msg);
        var memberIds = await db.ChatMemberships.Where(m => m.RoomId == roomId && m.IsActive && m.MemberId != u.MemberId).Select(m => m.MemberId).ToListAsync();
        foreach (var memberId in memberIds) db.MemberNotifications.Add(new MemberNotification { MemberId = memberId, Kind = "CHAT", ReferenceId = roomId, Title = "New chat message", Body = "A new message is available in your chatroom." });
        await db.SaveChangesAsync(); await tx.CommitAsync(); wake.Pulse(); await Changed(roomId); return Ok(new { msg.Id });
    }
    public record ReadRequest(long MessageId);
    [HttpPost("rooms/{roomId:int}/read")]
    public async Task<IActionResult> Read(int roomId, ReadRequest request) {
        var u = await Actor(); var r = await db.ChatRooms.FindAsync(roomId); if (u == null || r == null || !await CanRead(u, r)) return Forbid();
        var max = await db.ChatMessages.Where(m => m.RoomId == roomId).MaxAsync(m => (long?)m.Id) ?? 0;
        var through = Math.Clamp(request.MessageId, 0, max);
        var changed = await db.ChatMemberships.Where(m => m.RoomId == roomId && m.MemberId == u.MemberId && m.IsActive && m.LastReadMessageId < through).ExecuteUpdateAsync(s => s.SetProperty(m => m.LastReadMessageId, through));
        if (changed > 0) await Changed(roomId); return NoContent();
    }
}
