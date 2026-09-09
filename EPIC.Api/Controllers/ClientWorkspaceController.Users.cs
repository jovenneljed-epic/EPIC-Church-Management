using System.ComponentModel.DataAnnotations;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers;
public partial class ClientWorkspaceController
{
    private static readonly string[] WorkspaceModules = ["Dashboard","ChurchProfile","Members","Services","Attendance","Giving","Income","Expenses","Visitors","Ministries","Events","Learning","Reports","Settings"];
    private async Task<ClientMember?> Manager()
    {
        var a = await Account("Settings");
        // Read administration authority directly so revoked permission does not use a cached grant.
        return a != null && await db.ClientPermissions.AnyAsync(p => p.ClientRoleId == a.ClientRoleId && p.ModuleName == "Settings" && p.CanView && p.CanManage) ? a : null;
    }
    private async Task<bool> CanAssign(ClientMember actor, int roleId)
    {
        if (!await db.ClientRoles.AnyAsync(r => r.ClientRoleId == roleId && r.CustomerId == actor.CustomerId && r.IsActive)) return false;
        var own = await db.ClientPermissions.AsNoTracking().Where(p => p.ClientRoleId == actor.ClientRoleId).ToListAsync();
        var target = await db.ClientPermissions.AsNoTracking().Where(p => p.ClientRoleId == roleId).ToListAsync();
        return target.All(p => !(p.CanView || p.CanCreate || p.CanEdit || p.CanDelete || p.CanManage) || own.Any(o => o.ModuleName == p.ModuleName && (!p.CanView || o.CanView) && (!p.CanCreate || o.CanCreate) && (!p.CanEdit || o.CanEdit) && (!p.CanDelete || o.CanDelete) && (!p.CanManage || o.CanManage)));
    }
    [HttpGet("administration")]
    public async Task<IActionResult> Administration()
    {
        var a = await Manager(); if (a == null) return Denied();
        var users = await db.ClientMembers.AsNoTracking().Where(u => u.CustomerId == a.CustomerId)
            .OrderBy(u => u.Username).Select(u => new { u.ClientMemberId, u.MemberId, u.Username, u.Email, u.ClientRoleId, u.IsActive }).ToListAsync();
        var roles = await db.ClientRoles.AsNoTracking().Where(r => r.CustomerId == a.CustomerId && r.IsActive)
            .Select(r => new { r.ClientRoleId, r.RoleName, r.IsSystemRole, permissions = r.ClientPermissions.Select(p => new { p.ModuleName, p.CanView, p.CanCreate, p.CanEdit, p.CanDelete, p.CanManage }) }).ToListAsync();
        var members = await db.Members.AsNoTracking().Where(m => m.CustomerId == a.CustomerId && m.Status == "ACTIVE")
            .OrderBy(m => m.LastName).Select(m => new { m.MemberId, name = m.FirstName + " " + m.LastName, m.MemberCode }).ToListAsync();
        return Ok(new { currentUserId = a.ClientMemberId, users, roles, members, modules = WorkspaceModules });
    }
    public class WorkspaceUserRequest
    {
        public int MemberId { get; set; }
        public int ClientRoleId { get; set; }
        [Required, StringLength(100), RegularExpression(@"[a-zA-Z0-9._-]{3,100}")] public string Username { get; set; } = "";
        [EmailAddress, StringLength(200)] public string? Email { get; set; }
        [StringLength(72)] public string? Password { get; set; }
        public bool IsActive { get; set; } = true;
    }
    [HttpPost("users")]
    public Task<IActionResult> CreateWorkspaceUser(WorkspaceUserRequest request) => SaveWorkspaceUser(0, request);
    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> SaveWorkspaceUser(int id, WorkspaceUserRequest request)
    {
        var a = await Manager(); if (a == null) return Denied();
        if (id == a.ClientMemberId) return BadRequest(new { message = "Use My account for your own details. Another administrator must change your role or access." });
        if (!await CanAssign(a, request.ClientRoleId)) return Denied();
        if (!await db.Members.AnyAsync(m => m.MemberId == request.MemberId && m.CustomerId == a.CustomerId && m.Status == "ACTIVE"))
            return BadRequest(new { message = "Choose an active member of your church." });
        var row = id == 0 ? new ClientMember { CustomerId = a.CustomerId } : await db.ClientMembers.FirstOrDefaultAsync(u => u.ClientMemberId == id && u.CustomerId == a.CustomerId);
        if (row == null) return NotFound();
        if (id != 0 && !await CanAssign(a, row.ClientRoleId)) return Denied();
        var username = request.Username.Trim(); var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        if (await db.ClientMembers.AnyAsync(u => u.ClientMemberId != id && (u.Username.ToUpper() == username.ToUpper() || email != null && u.Email != null && u.Email.ToUpper() == email.ToUpper())))
            return Conflict(new { message = "That username or email is already in use." });
        if (await db.ClientMembers.AnyAsync(u => u.ClientMemberId != id && u.CustomerId == a.CustomerId && u.MemberId == request.MemberId))
            return Conflict(new { message = "This member already has a client account. Update that account instead." });
        if (id == 0 || !string.IsNullOrEmpty(request.Password)) {
            if (request.Password == null || request.Password.Length < 10 || System.Text.Encoding.UTF8.GetByteCount(request.Password) > 72)
                return BadRequest(new { message = "Use a password of at least 10 characters and at most 72 UTF-8 bytes." });
            row.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }
        row.MemberId = request.MemberId; row.ClientRoleId = request.ClientRoleId; row.Username = username; row.Email = email;
        row.IsActive = request.IsActive; row.Status = request.IsActive ? "ACTIVE" : "INACTIVE";
        if (id == 0) db.ClientMembers.Add(row);
        await db.SaveChangesAsync(); return Ok(new { message = "Client account saved." });
    }
    public class WorkspaceGrant
    {
        [Required] public string ModuleName { get; set; } = "";
        public bool CanView { get; set; }
        public bool CanCreate { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanManage { get; set; }
    }
    public class WorkspaceRoleRequest
    {
        [Required, StringLength(100)] public string RoleName { get; set; } = "";
        [Required, MaxLength(14)] public List<WorkspaceGrant> Permissions { get; set; } = [];
    }
    [HttpPost("roles")]
    public Task<IActionResult> CreateWorkspaceRole(WorkspaceRoleRequest request) => SaveWorkspaceRole(0, request);
    [HttpPut("roles/{id:int}")]
    public async Task<IActionResult> SaveWorkspaceRole(int id, WorkspaceRoleRequest request)
    {
        var a = await Manager(); if (a == null) return Denied();
        var role = id == 0 ? new ClientRole { CustomerId = a.CustomerId } : await db.ClientRoles.Include(r => r.ClientPermissions).FirstOrDefaultAsync(r => r.ClientRoleId == id && r.CustomerId == a.CustomerId);
        if (role == null) return NotFound();
        if (id == a.ClientRoleId || role.IsSystemRole) return BadRequest(new { message = "System roles and your current role are protected. Create a custom role instead." });
        if (id != 0 && !await CanAssign(a, id)) return Denied();
        var name = request.RoleName.Trim();
        if (name.Length == 0 || request.Permissions.Any(p => !WorkspaceModules.Contains(p.ModuleName)) || request.Permissions.Select(p => p.ModuleName).Distinct().Count() != request.Permissions.Count)
            return BadRequest(new { message = "Enter a role name and one permission row per module." });
        if (await db.ClientRoles.AnyAsync(r => r.CustomerId == a.CustomerId && r.ClientRoleId != id && r.RoleName.ToUpper() == name.ToUpper())) return Conflict(new { message = "That role name already exists." });
        var own = await db.ClientPermissions.AsNoTracking().Where(p => p.ClientRoleId == a.ClientRoleId).ToListAsync();
        foreach (var p in request.Permissions) {
            if (!p.CanView && (p.CanCreate || p.CanEdit || p.CanDelete || p.CanManage)) return BadRequest(new { message = "Enable View before granting other actions." });
            if ((p.CanView || p.CanCreate || p.CanEdit || p.CanDelete || p.CanManage) && !own.Any(o => o.ModuleName == p.ModuleName && (!p.CanView || o.CanView) && (!p.CanCreate || o.CanCreate) && (!p.CanEdit || o.CanEdit) && (!p.CanDelete || o.CanDelete) && (!p.CanManage || o.CanManage))) return Denied();
        }
        role.RoleName = name; role.UpdatedDate = DateTime.UtcNow;
        foreach (var module in WorkspaceModules) {
            var incoming = request.Permissions.FirstOrDefault(p => p.ModuleName == module);
            var p = role.ClientPermissions.FirstOrDefault(p => p.ModuleName == module);
            if (p == null) { p = new ClientPermission { ModuleName = module }; role.ClientPermissions.Add(p); }
            p.CanView = incoming?.CanView ?? false; p.CanCreate = incoming?.CanCreate ?? false; p.CanEdit = incoming?.CanEdit ?? false; p.CanDelete = incoming?.CanDelete ?? false; p.CanManage = incoming?.CanManage ?? false;
        }
        if (id == 0) db.ClientRoles.Add(role);
        await db.SaveChangesAsync(); permissions.ClearPermissionsCache(role.ClientRoleId, a.CustomerId);
        return Ok(new { message = "Role and permissions saved." });
    }
}

