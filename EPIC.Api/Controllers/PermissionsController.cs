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
    public class PermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PermissionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL PERMISSIONS
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var permissions = await _context.Permissions
                .AsNoTracking()
                .OrderBy(p => p.RoleId)
                .ThenBy(p => p.Module)
                .Select(p => new
                {
                    p.PermissionId,
                    p.RoleId,
                    p.Module,
                    p.CanView,
                    p.CanCreate,
                    p.CanEdit,
                    p.CanDelete,
                    p.CanExport,
                    p.CreatedDate
                })
                .ToListAsync();

            return Ok(permissions);
        }

        // =========================================================
        // GET PERMISSIONS BY ROLE
        // =========================================================

        [HttpGet("role/{roleId}")]
        public async Task<IActionResult> GetByRole(int roleId)
        {
            var roleExists = await _context.Roles
                .AnyAsync(r => r.RoleId == roleId);

            if (!roleExists)
                return NotFound(new
                {
                    message = "Role not found."
                });

            var permissions = await _context.Permissions
                .AsNoTracking()
                .Where(p => p.RoleId == roleId)
                .OrderBy(p => p.Module)
                .Select(p => new
                {
                    p.PermissionId,
                    p.RoleId,
                    p.Module,
                    p.CanView,
                    p.CanCreate,
                    p.CanEdit,
                    p.CanDelete,
                    p.CanExport,
                    p.CreatedDate
                })
                .ToListAsync();

            return Ok(permissions);
        }

        // =========================================================
        // GET SINGLE PERMISSION
        // =========================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var permission = await _context.Permissions
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PermissionId == id);

            if (permission == null)
                return NotFound(new
                {
                    message = "Permission not found."
                });

            return Ok(permission);
        }

        // =========================================================
        // CREATE PERMISSION
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> Create(Permission permission)
        {
            if (permission.RoleId <= 0)
                return BadRequest("RoleId is required.");

            if (string.IsNullOrWhiteSpace(permission.Module))
                return BadRequest("Module is required.");

            permission.Module = permission.Module.Trim();

            var roleExists = await _context.Roles
                .AnyAsync(r => r.RoleId == permission.RoleId);

            if (!roleExists)
                return BadRequest("Selected role does not exist.");

            var exists = await _context.Permissions
                .AnyAsync(p =>
                    p.RoleId == permission.RoleId &&
                    p.Module == permission.Module);

            if (exists)
                return Conflict(new
                {
                    message = "Permission for this role and module already exists."
                });

            permission.CreatedDate = DateTime.Now;

            _context.Permissions.Add(permission);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = permission.PermissionId },
                permission);
        }

        // =========================================================
        // UPDATE PERMISSION
        // =========================================================

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            Permission updated)
        {
            var permission = await _context.Permissions
                .FirstOrDefaultAsync(p => p.PermissionId == id);

            if (permission == null)
                return NotFound(new
                {
                    message = "Permission not found."
                });

            permission.CanView = updated.CanView;
            permission.CanCreate = updated.CanCreate;
            permission.CanEdit = updated.CanEdit;
            permission.CanDelete = updated.CanDelete;
            permission.CanExport = updated.CanExport;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Permission updated successfully.",
                permission
            });
        }

        // =========================================================
        // DELETE PERMISSION
        // =========================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var permission = await _context.Permissions
                .FirstOrDefaultAsync(p => p.PermissionId == id);

            if (permission == null)
                return NotFound(new
                {
                    message = "Permission not found."
                });

            _context.Permissions.Remove(permission);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Permission deleted successfully."
            });
        }
    }
}