using EPIC.Api.Data;
using EPIC.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EPIC.Api.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly ApplicationDbContext _context;

        public PermissionService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CHECK CURRENT USER PERMISSION
        // =========================================================

        public async Task<bool> HasPermissionAsync(
            ClaimsPrincipal user,
            string module,
            string action)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            // -----------------------------------------------------
            // ADMIN BYPASS
            //
            // ADMIN automatically has full access.
            // Permissions are still stored for Admin so the
            // permissions screen can display them.
            // -----------------------------------------------------

            if (user.IsInRole("ADMIN"))
            {
                return true;
            }

            // -----------------------------------------------------
            // GET USER ID
            // -----------------------------------------------------

            var userIdClaim =
                user.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return false;
            }

            if (!int.TryParse(
                    userIdClaim.Value,
                    out int userId))
            {
                return false;
            }

            return await HasPermissionAsync(
                userId,
                module,
                action);
        }


        // =========================================================
        // CHECK USER ID PERMISSION
        // =========================================================

        public async Task<bool> HasPermissionAsync(
            int userId,
            string module,
            string action)
        {
            // -----------------------------------------------------
            // VALIDATE INPUT
            // -----------------------------------------------------

            if (userId <= 0)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(module))
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(action))
            {
                return false;
            }

            module = module.Trim();

            action = action
                .Trim()
                .ToLowerInvariant();


            // -----------------------------------------------------
            // GET ACTIVE USER
            // -----------------------------------------------------

            var dbUser =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        u =>
                            u.UserId == userId &&
                            u.IsActive);

            if (dbUser == null)
            {
                return false;
            }


            // -----------------------------------------------------
            // GET ACTIVE ROLE
            // -----------------------------------------------------

            var role =
                await _context.Roles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        r =>
                            r.RoleId == dbUser.RoleId &&
                            r.IsActive);

            if (role == null)
            {
                return false;
            }


            // -----------------------------------------------------
            // ADMIN BYPASS
            // -----------------------------------------------------

            if (
                role.RoleName
                    .Trim()
                    .Equals(
                        "ADMIN",
                        StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }


            // -----------------------------------------------------
            // GET ROLE PERMISSION
            // -----------------------------------------------------

            var permission =
                await _context.Permissions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        p =>
                            p.RoleId == dbUser.RoleId &&
                            p.Module == module);

            // -----------------------------------------------------
            // NO PERMISSION = DENIED
            // -----------------------------------------------------

            if (permission == null)
            {
                return false;
            }


            // -----------------------------------------------------
            // CHECK ACTION
            // -----------------------------------------------------

            return action switch
            {
                "view" =>
                    permission.CanView,

                "create" =>
                    permission.CanCreate,

                "edit" =>
                    permission.CanEdit,

                "delete" =>
                    permission.CanDelete,

                "export" =>
                    permission.CanExport,

                _ => false
            };
        }


        // =========================================================
        // CHECK ADMIN
        // =========================================================

        public async Task<bool> IsAdminAsync(
            ClaimsPrincipal user)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            // -----------------------------------------------------
            // Check JWT role
            // -----------------------------------------------------

            if (user.IsInRole("ADMIN"))
            {
                return true;
            }

            // -----------------------------------------------------
            // Also verify against database
            // -----------------------------------------------------

            var userIdClaim =
                user.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return false;
            }

            if (!int.TryParse(
                    userIdClaim.Value,
                    out int userId))
            {
                return false;
            }

            var dbUser =
                await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        u =>
                            u.UserId == userId &&
                            u.IsActive);

            if (dbUser == null)
            {
                return false;
            }

            var role =
                await _context.Roles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        r =>
                            r.RoleId == dbUser.RoleId &&
                            r.IsActive);

            if (role == null)
            {
                return false;
            }

            return role.RoleName
                .Trim()
                .Equals(
                    "ADMIN",
                    StringComparison.OrdinalIgnoreCase);
        }
    }
}