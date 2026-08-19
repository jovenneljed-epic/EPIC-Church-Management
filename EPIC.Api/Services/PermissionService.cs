using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EPIC.Api.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly ApplicationDbContext _context;

        private static readonly HashSet<string> AllowedActions =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "view",
                "create",
                "edit",
                "delete",
                "export"
            };

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
            // -----------------------------------------------------
            // AUTHENTICATION
            // -----------------------------------------------------

            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            // -----------------------------------------------------
            // NORMALIZE INPUT
            // -----------------------------------------------------

            var normalizedModule =
                NormalizeModule(module);

            var normalizedAction =
                NormalizeAction(action);

            if (normalizedModule == null ||
                normalizedAction == null)
            {
                return false;
            }

            // -----------------------------------------------------
            // ADMIN
            // -----------------------------------------------------

            if (await IsAdminAsync(user))
            {
                return true;
            }

            // -----------------------------------------------------
            // GET USER ID
            // -----------------------------------------------------

            var userId =
                GetUserId(user);

            if (!userId.HasValue)
            {
                return false;
            }

            // -----------------------------------------------------
            // DATABASE PERMISSION
            // -----------------------------------------------------

            return await HasPermissionAsync(
                userId.Value,
                normalizedModule,
                normalizedAction);
        }

        // =========================================================
        // CHECK USER ID PERMISSION
        // =========================================================

        public async Task<bool> HasPermissionAsync(
            int userId,
            string module,
            string action)
        {
            if (userId <= 0)
            {
                return false;
            }

            var normalizedModule =
                NormalizeModule(module);

            var normalizedAction =
                NormalizeAction(action);

            if (normalizedModule == null ||
                normalizedAction == null)
            {
                return false;
            }

            // -----------------------------------------------------
            // GET USER ROLE
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .AsNoTracking()
                    .Where(u =>
                        u.UserId == userId &&
                        u.IsActive)
                    .Select(u => new
                    {
                        u.UserId,
                        u.RoleId,

                        RoleName =
                            u.Role != null
                                ? u.Role.RoleName
                                : null
                    })
                    .FirstOrDefaultAsync();

            if (user == null)
            {
                return false;
            }

            // -----------------------------------------------------
            // ADMIN BYPASS
            // -----------------------------------------------------

            if (IsAdminRole(user.RoleName))
            {
                return true;
            }

            // -----------------------------------------------------
            // GET ROLE PERMISSION
            //
            // Module comparison is performed using a normalized
            // database value after retrieving the role permissions.
            // This avoids repeatedly calling ToLower/Trim inside
            // the database predicate.
            // -----------------------------------------------------

            var permissions =
                await _context.Permissions
                    .AsNoTracking()
                    .Where(p =>
                        p.RoleId == user.RoleId)
                    .ToListAsync();

            var permission =
                permissions.FirstOrDefault(p =>
                    string.Equals(
                        p.Module?.Trim(),
                        normalizedModule,
                        StringComparison.OrdinalIgnoreCase));

            if (permission == null)
            {
                return false;
            }

            // -----------------------------------------------------
            // CHECK ACTION
            // -----------------------------------------------------

            return HasPermissionAction(
                permission,
                normalizedAction);
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
            // FIRST CHECK JWT ROLE
            // -----------------------------------------------------

            if (IsAdminFromClaims(user))
            {
                return true;
            }

            // -----------------------------------------------------
            // GET USER ID
            // -----------------------------------------------------

            var userId =
                GetUserId(user);

            if (!userId.HasValue)
            {
                return false;
            }

            // -----------------------------------------------------
            // CHECK DATABASE ROLE
            // -----------------------------------------------------

            var roleName =
                await _context.Users
                    .AsNoTracking()
                    .Where(u =>
                        u.UserId == userId.Value &&
                        u.IsActive)
                    .Select(u =>
                        u.Role != null
                            ? u.Role.RoleName
                            : null)
                    .FirstOrDefaultAsync();

            return IsAdminRole(roleName);
        }

        // =========================================================
        // GET USER ID FROM JWT
        // =========================================================

        private static int? GetUserId(
            ClaimsPrincipal user)
        {
            var possibleClaims =
                new[]
                {
                    ClaimTypes.NameIdentifier,
                    "userId",
                    "UserId",
                    "user_id",
                    "sub"
                };

            foreach (var claimType in possibleClaims)
            {
                var value =
                    user.FindFirst(claimType)?.Value;

                if (int.TryParse(
                    value,
                    out var userId))
                {
                    return userId;
                }
            }

            return null;
        }

        // =========================================================
        // ADMIN ROLE CHECK
        // =========================================================

        private static bool IsAdminRole(
            string? roleName)
        {
            return string.Equals(
                roleName?.Trim(),
                "ADMIN",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // ADMIN CLAIM CHECK
        // =========================================================

        private static bool IsAdminFromClaims(
            ClaimsPrincipal user)
        {
            return
                user.IsInRole("ADMIN") ||
                user.IsInRole("Admin") ||
                user.IsInRole("admin");
        }

        // =========================================================
        // CHECK PERMISSION ACTION
        // =========================================================

        private static bool HasPermissionAction(
            Permission permission,
            string action)
        {
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

                _ =>
                    false
            };
        }

        // =========================================================
        // NORMALIZE MODULE
        // =========================================================

        private static string? NormalizeModule(
            string? module)
        {
            if (string.IsNullOrWhiteSpace(module))
            {
                return null;
            }

            return module.Trim();
        }

        // =========================================================
        // NORMALIZE ACTION
        // =========================================================

        private static string? NormalizeAction(
            string? action)
        {
            if (string.IsNullOrWhiteSpace(action))
            {
                return null;
            }

            var normalized =
                action.Trim().ToLowerInvariant();

            return AllowedActions.Contains(normalized)
                ? normalized
                : null;
        }
    }
}