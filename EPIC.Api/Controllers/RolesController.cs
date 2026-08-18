```csharp
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // =========================================================
        // ALL EPIC PERMISSION MODULES
        // =========================================================
        //
        // IMPORTANT:
        // Keep these names exactly the same as the frontend
        // PermissionService.ts module names.
        //
        // =========================================================

        private static readonly string[] PermissionModules =
        {
            "Dashboard",
            "Members",
            "Attendance",
            "Visitors",
            "Church Services",
            "Giving",
            "Income",
            "Expenses",
            "Ministries",
            "Events",
            "Reports",
            "Settings",

            // New permission-controlled modules
            "Demo Requests",
            "EPIC Learning"
        };

        public RolesController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ROLES
        // GET: api/Roles
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .OrderBy(r => r.RoleName)
                .Select(r => new
                {
                    roleId = r.RoleId,
                    roleName = r.RoleName,
                    description = r.Description,
                    isActive = r.IsActive,
                    createdDate = r.CreatedDate,
                    userCount = r.Users.Count()
                })
                .ToListAsync();

            return Ok(roles);
        }

        // =========================================================
        // GET ROLE BY ID
        // GET: api/Roles/1
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetRole(int id)
        {
            var role = await _context.Roles
                .AsNoTracking()
                .Where(r => r.RoleId == id)
                .Select(r => new
                {
                    roleId = r.RoleId,
                    roleName = r.RoleName,
                    description = r.Description,
                    isActive = r.IsActive,
                    createdDate = r.CreatedDate,
                    userCount = r.Users.Count()
                })
                .FirstOrDefaultAsync();

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            return Ok(role);
        }

        // =========================================================
        // CREATE ROLE
        // POST: api/Roles
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateRole(
            CreateRoleRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.RoleName))
            {
                return BadRequest(new
                {
                    message = "Role name is required."
                });
            }

            string roleName =
                request.RoleName
                    .Trim()
                    .ToUpper();

            bool exists =
                await _context.Roles
                    .AnyAsync(r =>
                        r.RoleName == roleName);

            if (exists)
            {
                return Conflict(new
                {
                    message = "Role already exists."
                });
            }

            var role = new Role
            {
                RoleName = roleName,

                Description =
                    request.Description?
                        .Trim() ?? "",

                IsActive = true,

                CreatedDate =
                    DateTime.Now
            };

            _context.Roles.Add(role);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // CREATE DEFAULT PERMISSION RECORDS
            // -----------------------------------------------------
            //
            // Every new role receives all EPIC modules.
            //
            // Default:
            // View   = false
            // Create = false
            // Edit   = false
            // Delete = false
            // Export = false
            //
            // Admin still receives automatic full access through
            // PermissionService.
            //
            // -----------------------------------------------------

            foreach (var module in PermissionModules)
            {
                _context.Permissions.Add(
                    new Permission
                    {
                        RoleId = role.RoleId,
                        Module = module,
                        CanView = false,
                        CanCreate = false,
                        CanEdit = false,
                        CanDelete = false,
                        CanExport = false
                    });
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetRole),
                new
                {
                    id = role.RoleId
                },
                new
                {
                    message =
                        "Role created successfully.",

                    roleId =
                        role.RoleId,

                    roleName =
                        role.RoleName,

                    description =
                        role.Description,

                    isActive =
                        role.IsActive
                });
        }

        // =========================================================
        // UPDATE ROLE
        // PUT: api/Roles/1
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateRole(
            int id,
            UpdateRoleRequest request)
        {
            var role =
                await _context.Roles
                    .FirstOrDefaultAsync(r =>
                        r.RoleId == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message =
                        "Role not found."
                });
            }

            if (request == null ||
                string.IsNullOrWhiteSpace(
                    request.RoleName))
            {
                return BadRequest(new
                {
                    message =
                        "Role name is required."
                });
            }

            string roleName =
                request.RoleName
                    .Trim()
                    .ToUpper();

            bool duplicate =
                await _context.Roles
                    .AnyAsync(r =>
                        r.RoleId != id &&
                        r.RoleName == roleName);

            if (duplicate)
            {
                return Conflict(new
                {
                    message =
                        "Another role already uses this name."
                });
            }

            role.RoleName =
                roleName;

            role.Description =
                request.Description?
                    .Trim() ?? "";

            role.IsActive =
                request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Role updated successfully.",

                roleId =
                    role.RoleId,

                roleName =
                    role.RoleName,

                description =
                    role.Description,

                isActive =
                    role.IsActive
            });
        }

        // =========================================================
        // DEACTIVATE ROLE
        // DELETE: api/Roles/1
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRole(
            int id)
        {
            var role =
                await _context.Roles
                    .Include(r => r.Users)
                    .FirstOrDefaultAsync(r =>
                        r.RoleId == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message =
                        "Role not found."
                });
            }

            // -----------------------------------------------------
            // PROTECT ROLE IF ACTIVE USERS EXIST
            // -----------------------------------------------------

            if (role.Users.Any(u =>
                    u.IsActive))
            {
                return BadRequest(new
                {
                    message =
                        "This role cannot be deactivated because active users are assigned to it."
                });
            }

            role.IsActive =
                false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Role deactivated successfully.",

                roleId =
                    role.RoleId
            });
        }

        // =========================================================
        // GET ROLE PERMISSIONS
        // GET: api/Roles/1/permissions
        // =========================================================

        [HttpGet("{id:int}/permissions")]
        public async Task<IActionResult> GetPermissions(
            int id)
        {
            var role =
                await _context.Roles
                    .FirstOrDefaultAsync(r =>
                        r.RoleId == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message =
                        "Role not found."
                });
            }

            // -----------------------------------------------------
            // ENSURE ALL EPIC MODULES EXIST
            // -----------------------------------------------------
            //
            // This is the important part.
            //
            // If Demo Requests or EPIC Learning do not yet exist
            // in the Permissions table for this role, they are
            // automatically created.
            //
            // Existing permissions are NEVER overwritten.
            //
            // -----------------------------------------------------

            var existingModules =
                await _context.Permissions
                    .Where(p =>
                        p.RoleId == id)
                    .Select(p =>
                        p.Module)
                    .ToListAsync();

            var existingNormalized =
                existingModules
                    .Select(NormalizeModule)
                    .ToHashSet();

            bool permissionRecordsAdded =
                false;

            foreach (var module
                     in PermissionModules)
            {
                if (!existingNormalized
                    .Contains(
                        NormalizeModule(module)))
                {
                    _context.Permissions.Add(
                        new Permission
                        {
                            RoleId =
                                id,

                            Module =
                                module,

                            CanView =
                                false,

                            CanCreate =
                                false,

                            CanEdit =
                                false,

                            CanDelete =
                                false,

                            CanExport =
                                false
                        });

                    permissionRecordsAdded =
                        true;
                }
            }

            if (permissionRecordsAdded)
            {
                await _context.SaveChangesAsync();
            }

            // -----------------------------------------------------
            // RETURN COMPLETE PERMISSION LIST
            // -----------------------------------------------------

            var permissions =
                await _context.Permissions
                    .AsNoTracking()
                    .Where(p =>
                        p.RoleId == id)
                    .OrderBy(p =>
                        p.Module)
                    .Select(p => new
                    {
                        permissionId =
                            p.PermissionId,

                        roleId =
                            p.RoleId,

                        module =
                            p.Module,

                        canView =
                            p.CanView,

                        canCreate =
                            p.CanCreate,

                        canEdit =
                            p.CanEdit,

                        canDelete =
                            p.CanDelete,

                        canExport =
                            p.CanExport
                    })
                    .ToListAsync();

            return Ok(new
            {
                roleId =
                    role.RoleId,

                roleName =
                    role.RoleName,

                permissions
            });
        }

        // =========================================================
        // UPDATE ROLE PERMISSIONS
        // PUT: api/Roles/1/permissions
        // =========================================================

        [HttpPut("{id:int}/permissions")]
        public async Task<IActionResult> UpdatePermissions(
            int id,
            List<PermissionUpdateRequest> requests)
        {
            var role =
                await _context.Roles
                    .FirstOrDefaultAsync(r =>
                        r.RoleId == id);

            if (role == null)
            {
                return NotFound(new
                {
                    message =
                        "Role not found."
                });
            }

            if (requests == null ||
                requests.Count == 0)
            {
                return BadRequest(new
                {
                    message =
                        "Permission list cannot be empty."
                });
            }

            // -----------------------------------------------------
            // VALID MODULE SET
            // -----------------------------------------------------

            var validModules =
                PermissionModules
                    .Select(NormalizeModule)
                    .ToHashSet();

            foreach (var request
                     in requests)
            {
                if (request == null ||
                    string.IsNullOrWhiteSpace(
                        request.Module))
                {
                    continue;
                }

                string module =
                    request.Module.Trim();

                // -------------------------------------------------
                // Only allow known EPIC modules
                // -------------------------------------------------

                if (!validModules.Contains(
                        NormalizeModule(module)))
                {
                    continue;
                }

                // -------------------------------------------------
                // Find existing permission
                // -------------------------------------------------

                var permission =
                    await _context.Permissions
                        .FirstOrDefaultAsync(p =>
                            p.RoleId == id &&
                            p.Module == module);

                // -------------------------------------------------
                // Create if missing
                // -------------------------------------------------

                if (permission == null)
                {
                    permission =
                        new Permission
                        {
                            RoleId =
                                id,

                            Module =
                                module
                        };

                    _context.Permissions.Add(
                        permission);
                }

                // -------------------------------------------------
                // UPDATE CHECKBOX VALUES
                // -------------------------------------------------

                permission.CanView =
                    request.CanView;

                permission.CanCreate =
                    request.CanCreate;

                permission.CanEdit =
                    request.CanEdit;

                permission.CanDelete =
                    request.CanDelete;

                permission.CanExport =
                    request.CanExport;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Role permissions updated successfully.",

                roleId =
                    id
            });
        }

        // =========================================================
        // NORMALIZE MODULE
        // =========================================================

        private static string NormalizeModule(
            string? module)
        {
            return (module ?? "")
                .Trim()
                .ToLowerInvariant()
                .Replace(
                    "  ",
                    " ");
        }
    }

    // =============================================================
    // CREATE ROLE REQUEST
    // =============================================================

    public class CreateRoleRequest
    {
        public string RoleName { get; set; }
            = string.Empty;

        public string? Description { get; set; }
    }

    // =============================================================
    // UPDATE ROLE REQUEST
    // =============================================================

    public class UpdateRoleRequest
    {
        public string RoleName { get; set; }
            = string.Empty;

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }

    // =============================================================
    // PERMISSION UPDATE REQUEST
    // =============================================================

    public class PermissionUpdateRequest
    {
        public string Module { get; set; }
            = string.Empty;

        public bool CanView { get; set; }

        public bool CanCreate { get; set; }

        public bool CanEdit { get; set; }

        public bool CanDelete { get; set; }

        public bool CanExport { get; set; }
    }
}
```
