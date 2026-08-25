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
            // GET USER ID
            // -----------------------------------------------------

            var userId =
                GetUserId(user);

            if (!userId.HasValue)
            {
                return false;
            }

            // -----------------------------------------------------
            // CHECK DATABASE ACCOUNT
            //
            // IMPORTANT:
            // Do not trust only the JWT.
            // The database is the current source of truth.
            // -----------------------------------------------------

            var account =
                await GetAccountAsync(
                    userId.Value);

            if (account == null)
            {
                return false;
            }

            // -----------------------------------------------------
            // ACCOUNT ACTIVE
            // -----------------------------------------------------

            if (!account.IsActive)
            {
                return false;
            }

            // -----------------------------------------------------
            // APPROVAL STATUS
            //
            // Existing ADMIN/STAFF accounts with NULL approval
            // status are treated as APPROVED.
            // -----------------------------------------------------

            var approvalStatus =
                NormalizeApprovalStatus(
                    account.ApprovalStatus);

            if (approvalStatus != "APPROVED")
            {
                return false;
            }

            // -----------------------------------------------------
            // ADMIN BYPASS
            // -----------------------------------------------------

            if (IsAdminRole(account.RoleName))
            {
                return true;
            }

            // -----------------------------------------------------
            // ROLE PERMISSION
            // -----------------------------------------------------

            return await HasRolePermissionAsync(
                account.RoleId,
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
            // GET ACCOUNT
            // -----------------------------------------------------

            var account =
                await GetAccountAsync(userId);

            if (account == null)
            {
                return false;
            }

            // -----------------------------------------------------
            // ACTIVE CHECK
            // -----------------------------------------------------

            if (!account.IsActive)
            {
                return false;
            }

            // -----------------------------------------------------
            // APPROVAL CHECK
            // -----------------------------------------------------

            var approvalStatus =
                NormalizeApprovalStatus(
                    account.ApprovalStatus);

            if (approvalStatus != "APPROVED")
            {
                return false;
            }

            // -----------------------------------------------------
            // ADMIN BYPASS
            // -----------------------------------------------------

            if (IsAdminRole(account.RoleName))
            {
                return true;
            }

            // -----------------------------------------------------
            // ROLE PERMISSION
            // -----------------------------------------------------

            return await HasRolePermissionAsync(
                account.RoleId,
                normalizedModule,
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
            // GET USER ID
            // -----------------------------------------------------

            var userId =
                GetUserId(user);

            if (!userId.HasValue)
            {
                return false;
            }

            // -----------------------------------------------------
            // DATABASE IS SOURCE OF TRUTH
            //
            // Do not grant ADMIN based only on the JWT role claim.
            // -----------------------------------------------------

            var account =
                await GetAccountAsync(
                    userId.Value);

            if (account == null)
            {
                return false;
            }

            // -----------------------------------------------------
            // ACTIVE
            // -----------------------------------------------------

            if (!account.IsActive)
            {
                return false;
            }

            // -----------------------------------------------------
            // APPROVED
            // -----------------------------------------------------

            var approvalStatus =
                NormalizeApprovalStatus(
                    account.ApprovalStatus);

            if (approvalStatus != "APPROVED")
            {
                return false;
            }

            // -----------------------------------------------------
            // ADMIN ROLE
            // -----------------------------------------------------

            return IsAdminRole(
                account.RoleName);
        }

        // =========================================================
        // GET ACCOUNT
        // =========================================================

        private async Task<UserAccountInfo?> GetAccountAsync(
            int userId)
        {
            if (userId <= 0)
            {
                return null;
            }

            return await _context.Users
                .AsNoTracking()
                .Where(u =>
                    u.UserId == userId)
                .Select(u => new UserAccountInfo
                {
                    UserId =
                        u.UserId,

                    RoleId =
                        u.RoleId,

                    RoleName =
                        u.Role != null
                            ? u.Role.RoleName
                            : null,

                    IsActive =
                        u.IsActive,

                    ApprovalStatus =
                        u.ApprovalStatus
                })
                .FirstOrDefaultAsync();
        }

        // =========================================================
        // CHECK ROLE PERMISSION
        // =========================================================

        private async Task<bool> HasRolePermissionAsync(
            int roleId,
            string module,
            string action)
        {
            if (roleId <= 0)
            {
                return false;
            }

            // -----------------------------------------------------
            // LOAD ROLE PERMISSIONS
            // -----------------------------------------------------

            var permissions =
                await _context.Permissions
                    .AsNoTracking()
                    .Where(p =>
                        p.RoleId == roleId)
                    .ToListAsync();

            // -----------------------------------------------------
            // FIND MODULE
            //
            // Comparison is performed in memory so that Trim()
            // and case-insensitive comparison do not interfere
            // with SQL translation/index usage.
            // -----------------------------------------------------

            var permission =
                permissions.FirstOrDefault(p =>
                    string.Equals(
                        p.Module?.Trim(),
                        module,
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
                action);
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

        // =========================================================
        // NORMALIZE APPROVAL STATUS
        // =========================================================

        private static string NormalizeApprovalStatus(
            string? status)
        {
            // Existing accounts such as ADMIN/STAFF that were
            // created before ApprovalStatus was introduced may
            // have NULL. Treat those as APPROVED.

            if (string.IsNullOrWhiteSpace(status))
            {
                return "APPROVED";
            }

            return status
                .Trim()
                .ToUpperInvariant();
        }

        // =========================================================
        // ACCOUNT INFORMATION
        // =========================================================

        private sealed class UserAccountInfo
        {
            public int UserId { get; set; }

            public int RoleId { get; set; }

            public string? RoleName { get; set; }

            public bool IsActive { get; set; }

            public string? ApprovalStatus { get; set; }
        }
    }
}