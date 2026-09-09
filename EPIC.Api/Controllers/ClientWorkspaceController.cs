using System.ComponentModel.DataAnnotations;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers;

[ApiController, Authorize(Roles = "CLIENT"), Route("api/ClientWorkspace")]
[EPIC.Api.Authorization.ClientWorkspaceErrors]
public partial class ClientWorkspaceController(ApplicationDbContext db, IClientPermissionService permissions) : ControllerBase
{
    private async Task<ClientMember?> Account(string module, bool edit = false)
    {
        if (!int.TryParse(User.FindFirst("clientMemberId")?.Value, out var id) ||
            !int.TryParse(User.FindFirst("customerId")?.Value, out var customerId) ||
            !int.TryParse(User.FindFirst("clientRoleId")?.Value, out var roleId)) return null;
        var account = await db.ClientMembers.Include(a => a.Customer).Include(a => a.Member).Include(a => a.ClientRole)
            .FirstOrDefaultAsync(a => a.ClientMemberId == id && a.CustomerId == customerId && a.ClientRoleId == roleId);
        if (account == null || !account.IsActive || !Active(account.Status) || account.Customer == null || !Active(account.Customer.Status) ||
            account.Member == null || account.Member.CustomerId != customerId || !Active(account.Member.Status) ||
            account.ClientRole == null || account.ClientRole.CustomerId != customerId || !account.ClientRole.IsActive) return null;
        if (!await permissions.CanViewAsync(roleId, customerId, module) || (edit && !await permissions.CanEditAsync(roleId, customerId, module))) return null;
        if (module == "Learning") {
            var subscription = await db.Subscriptions.Include(s => s.SubscriptionPlan).Where(s => s.CustomerId == customerId).OrderByDescending(s => s.CreatedDate).ThenByDescending(s => s.SubscriptionId).FirstOrDefaultAsync();
            var now = DateTime.UtcNow;
            if (subscription?.SubscriptionPlan?.IncludesEPICLearning != true || subscription.StartDate > now ||
                (subscription.EndDate != null && subscription.EndDate <= now) ||
                !(Active(subscription.Status) || string.Equals(subscription.Status, "TRIAL", StringComparison.OrdinalIgnoreCase) && subscription.TrialEndsAt > now)) return null;
        }
        return account;
    }
    private static bool Active(string? value) => string.Equals(value?.Trim(), "ACTIVE", StringComparison.OrdinalIgnoreCase);
    private IActionResult Denied() => StatusCode(403, new { message = "Your account is inactive or does not have permission for this action." });

    [HttpGet("settings")]
    public async Task<IActionResult> Settings()
    {
        var a = await Account("Settings"); if (a == null) return Denied();
        return Ok(new { a.Username, a.Email, a.ContactNumber, a.CreatedDate, a.LastLoginDate, churchName = a.Customer!.ChurchName, roleName = a.ClientRole!.RoleName, canManageUsers = await Manager() != null });
    }
    public class ContactRequest
    {
        [EmailAddress, StringLength(200)] public string? Email { get; set; }
        [StringLength(20)] public string? ContactNumber { get; set; }
    }
    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(ContactRequest request)
    {
        var a = await Account("Settings", true); if (a == null) return Denied();
        a.Email = request.Email?.Trim(); a.ContactNumber = request.ContactNumber?.Trim();
        await db.SaveChangesAsync(); return Ok(new { message = "Account contact details updated." });
    }
    public class PasswordRequest
    {
        [Required] public string CurrentPassword { get; set; } = "";
        [Required, MinLength(10), MaxLength(72)] public string NewPassword { get; set; } = "";
    }
    [HttpPost("settings/password")]
    public async Task<IActionResult> Password(PasswordRequest request)
    {
        var a = await Account("Settings", true); if (a == null) return Denied();
        if (System.Text.Encoding.UTF8.GetByteCount(request.NewPassword) > 72) return BadRequest(new { message = "Password must be at most 72 UTF-8 bytes." });
        bool verified;
        try { verified = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, a.PasswordHash); } catch { verified = false; }
        if (!verified) return BadRequest(new { message = "Current password is incorrect." });
        if (request.CurrentPassword == request.NewPassword) return BadRequest(new { message = "Choose a different new password." });
        a.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync(); return Ok(new { message = "Password changed. Use your new password next time you sign in." });
    }

    [HttpGet("reports")]
    public async Task<IActionResult> Reports(DateTime from, DateTime to)
    {
        var a = await Account("Reports"); if (a == null) return Denied();
        if (from == default || to == default || to.Date < from.Date || (to.Date - from.Date).TotalDays > 366 || to.Year >= 9999)
            return BadRequest(new { message = "Choose a valid date range of at most 367 days." });
        var end = to.Date.AddDays(1); var start = from.Date;
        var canAttendance = await permissions.CanViewAsync(a.ClientRoleId, a.CustomerId, "Attendance");
        var canGiving = await permissions.CanViewAsync(a.ClientRoleId, a.CustomerId, "Giving");
        var canMembers = await permissions.CanViewAsync(a.ClientRoleId, a.CustomerId, "Members");
        var attendance = canAttendance ? await db.Attendances.AsNoTracking()
            .Where(r => r.Member != null && r.Member.CustomerId == a.CustomerId && r.AttendanceDate >= start && r.AttendanceDate < end &&
                (r.ChurchServiceId == null || r.ChurchService != null && r.ChurchService.CustomerId == a.CustomerId) &&
                (r.EventId == null || r.Event != null && r.Event.CustomerId == a.CustomerId))
            .GroupBy(r => r.Status).Select(g => new { status = g.Key, count = g.Count() }).ToListAsync() : null;
        var giving = canGiving ? await db.Givings.AsNoTracking().Where(r => r.CustomerId == a.CustomerId && r.GivingDate >= start && r.GivingDate < end)
            .GroupBy(r => r.GivingType).Select(g => new { type = g.Key, count = g.Count(), amount = g.Sum(r => r.Amount) }).ToListAsync() : null;
        int? members = canMembers ? await db.Members.CountAsync(m => m.CustomerId == a.CustomerId) : null;
        return Ok(new { from = start, to = to.Date, members, attendance, giving });
    }
}

