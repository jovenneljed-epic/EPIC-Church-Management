using EPIC.Core.Interfaces;
using EPIC.Api.Data;
using EPIC.Api.Models;


using Microsoft.EntityFrameworkCore;

using System.Security.Claims;

namespace EPIC.Api.Services
{
    /// <summary>
    /// CENTRAL EPIC PERMISSION SERVICE
    ///
    /// =========================================================
    /// NORMAL USER / ADMIN
    /// =========================================================
    ///
    /// JWT
    ///   ↓
    /// UserId
    ///   ↓
    /// Users
    ///   ↓
    /// Role
    ///   ↓
    /// Permissions
    ///
    /// ADMIN:
    ///   Active + Approved
    ///       ↓
    ///   FULL PERMISSION BYPASS
    ///
    /// =========================================================
    /// CLIENT
    /// =========================================================
    ///
    /// JWT clientMemberId
    ///       ↓
    /// ClientMembers
    ///       ↓
    /// CustomerId
    ///       ↓
    /// ClientRole
    ///       ↓
    /// ClientPermissions
    ///
    /// SECURITY RULE:
    ///
    /// CLIENT tenant identity MUST come from:
    ///
    ///     clientMemberId
    ///         ↓
    ///     ClientMembers.CustomerId
    ///
    /// NEVER trust ClientRoleId, userId, or role alone
    /// as the client tenant identity.
    /// </summary>
    public class PermissionService : IPermissionService
    {
        private readonly ApplicationDbContext _context;

        // =========================================================
        // ALLOWED ACTIONS
        // =========================================================

        private static readonly HashSet<string> AllowedActions =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "view",
                "create",
                "edit",
                "delete",
                "export",
                "manage"
            };

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        public PermissionService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CLAIM DIAGNOSTICS
        // =========================================================

        private static void LogAuthorizationContext(
            ClaimsPrincipal user,
            string module,
            string action)
        {
            Console.WriteLine();
            Console.WriteLine("==========================================");
            Console.WriteLine("EPIC PERMISSION SERVICE");
            Console.WriteLine("==========================================");

            Console.WriteLine(
                $"Authenticated: {user?.Identity?.IsAuthenticated}");

            Console.WriteLine(
                $"Role: {GetRole(user)}");

            Console.WriteLine(
                $"UserId: {GetUserId(user)}");

            Console.WriteLine(
                $"ClientMemberId: {GetClientMemberId(user)}");

            Console.WriteLine(
                $"Module: {module}");

            Console.WriteLine(
                $"Action: {action}");

            Console.WriteLine("==========================================");
        }

        // =========================================================
        // CURRENT USER PERMISSION
        // =========================================================

        public async Task<bool> HasPermissionAsync(
            ClaimsPrincipal user,
            string module,
            string action)
        {
            // =====================================================
            // DIAGNOSTIC
            // =====================================================

            LogAuthorizationContext(
                user,
                module,
                action);

            // =====================================================
            // AUTHENTICATION
            // =====================================================

            if (user?.Identity?.IsAuthenticated != true)
            {
                Console.WriteLine(
                    "[EPIC AUTH] DENIED: Not authenticated.");

                return false;
            }

            // =====================================================
            // NORMALIZE MODULE
            // =====================================================

            var normalizedModule =
                NormalizeModule(module);

            if (normalizedModule == null)
            {
                Console.WriteLine(
                    "[EPIC AUTH] DENIED: Invalid module.");

                return false;
            }

            // =====================================================
            // NORMALIZE ACTION
            // =====================================================

            var normalizedAction =
                NormalizeAction(action);

            if (normalizedAction == null)
            {
                Console.WriteLine(
                    "[EPIC AUTH] DENIED: Invalid action.");

                return false;
            }

            // =====================================================
            // DETERMINE CLIENT ACCOUNT
            // =====================================================

            if (IsClient(user))
            {
                Console.WriteLine(
                    "[EPIC AUTH] Authorization path: CLIENT");

                return await HasClientPermissionAsync(
                    user,
                    normalizedModule,
                    normalizedAction);
            }

            // =====================================================
            // NORMAL USER / ADMIN
            // =====================================================

            Console.WriteLine(
                "[EPIC AUTH] Authorization path: USER / ADMIN");

            var userId =
                GetUserId(user);

            if (!userId.HasValue)
            {
                Console.WriteLine(
                    "[EPIC AUTH] DENIED: UserId could not be resolved.");

                return false;
            }

            // =====================================================
            // LOAD DATABASE ACCOUNT
            // =====================================================

            var account =
                await GetAccountAsync(
                    userId.Value);

            if (account == null)
            {
                Console.WriteLine(
                    $"[EPIC AUTH] DENIED: User account not found. UserId={userId.Value}");

                return false;
            }

            Console.WriteLine(
                "[EPIC AUTH] DATABASE ACCOUNT");

            Console.WriteLine(
                $"UserId: {account.UserId}");

            Console.WriteLine(
                $"RoleId: {account.RoleId}");

            Console.WriteLine(
                $"RoleName: {account.RoleName}");

            Console.WriteLine(
                $"IsActive: {account.IsActive}");

            Console.WriteLine(
                $"ApprovalStatus: {account.ApprovalStatus}");

            // =====================================================
            // ACCOUNT ACTIVE
            // =====================================================

            if (!account.IsActive)
            {
                Console.WriteLine(
                    "[EPIC AUTH] DENIED: Account is inactive.");

                return false;
            }

            // =====================================================
            // APPROVAL
            // =====================================================

            if (!IsApproved(account.ApprovalStatus))
            {
                Console.WriteLine(
                    "[EPIC AUTH] DENIED: Account is not approved.");

                return false;
            }

            // =====================================================
            // ADMIN BYPASS
            //
            // IMPORTANT:
            //
            // Admin status is determined from the DATABASE ROLE.
            //
            // We do not rely solely on the JWT role claim.
            // =====================================================

            if (IsAdminRole(account.RoleName))
            {
                Console.WriteLine(
                    "[EPIC AUTH] ALLOWED: ADMIN BYPASS.");

                return true;
            }

            // =====================================================
            // NORMAL ROLE PERMISSION
            // =====================================================

            var rolePermission =
                await HasRolePermissionAsync(
                    account.RoleId,
                    normalizedModule,
                    normalizedAction);

            Console.WriteLine(
                $"[EPIC AUTH] Role permission result: {rolePermission}");

            return rolePermission;
        }

        // =========================================================
        // USER ID PERMISSION
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

            var account =
                await GetAccountAsync(userId);

            if (account == null)
            {
                return false;
            }

            if (!account.IsActive)
            {
                return false;
            }

            if (!IsApproved(account.ApprovalStatus))
            {
                return false;
            }

            // ADMIN FULL ACCESS

            if (IsAdminRole(account.RoleName))
            {
                return true;
            }

            return await HasRolePermissionAsync(
                account.RoleId,
                normalizedModule,
                normalizedAction);
        }

        // =========================================================
        // ADMIN CHECK
        // =========================================================

        public async Task<bool> IsAdminAsync(
            ClaimsPrincipal user)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            // CLIENT ACCOUNTS ARE NEVER ADMIN

            if (IsClient(user))
            {
                return false;
            }

            var userId =
                GetUserId(user);

            if (!userId.HasValue)
            {
                return false;
            }

            var account =
                await GetAccountAsync(
                    userId.Value);

            if (account == null)
            {
                return false;
            }

            if (!account.IsActive)
            {
                return false;
            }

            if (!IsApproved(account.ApprovalStatus))
            {
                return false;
            }

            return IsAdminRole(
                account.RoleName);
        }

        // =========================================================
        // GET CLIENT PERMISSIONS
        // =========================================================

        public async Task<
            IReadOnlyDictionary<string, ClientPermissionDto>>
            GetClientPermissionsAsync(
                ClaimsPrincipal user)
        {
            var empty =
                new Dictionary<string, ClientPermissionDto>(
                    StringComparer.OrdinalIgnoreCase);

            if (user?.Identity?.IsAuthenticated != true)
            {
                return empty;
            }

            if (!IsClient(user))
            {
                return empty;
            }

            // =====================================================
            // CLIENT MEMBER ID
            // =====================================================

            var clientMemberId =
                GetClientMemberId(user);

            if (!clientMemberId.HasValue)
            {
                Console.WriteLine(
                    "[EPIC CLIENT AUTH] " +
                    "Cannot load permissions: clientMemberId missing.");

                return empty;
            }

            // =====================================================
            // LOAD CLIENT PERMISSIONS
            // =====================================================

            var permissions =
                await (
                    from clientMember
                        in _context.ClientMembers.AsNoTracking()

                    join clientRole
                        in _context.ClientRoles.AsNoTracking()
                        on clientMember.ClientRoleId
                        equals clientRole.ClientRoleId

                    join permission
                        in _context.ClientPermissions.AsNoTracking()
                        on clientRole.ClientRoleId
                        equals permission.ClientRoleId

                    where
                        clientMember.ClientMemberId ==
                            clientMemberId.Value

                        && clientMember.IsActive

                        && clientMember.Status != null

                        && clientMember.Status
                            .Trim()
                            .ToUpper() == "ACTIVE"

                        && clientRole.IsActive

                        // TENANT ISOLATION

                        && clientRole.CustomerId ==
                            clientMember.CustomerId

                    select new ClientPermissionDto
                    {
                        ModuleName =
                            permission.ModuleName,

                        CanView =
                            permission.CanView,

                        CanCreate =
                            permission.CanCreate,

                        CanEdit =
                            permission.CanEdit,

                        CanDelete =
                            permission.CanDelete,

                        CanManage =
                            permission.CanManage
                    }
                )
                .ToListAsync();

            return permissions
                .Where(x =>
                    !string.IsNullOrWhiteSpace(
                        x.ModuleName))
                .GroupBy(
                    x => x.ModuleName!.Trim(),
                    StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    g => g.Key,
                    g => g.First(),
                    StringComparer.OrdinalIgnoreCase);
        }

        // =========================================================
        // CLIENT SINGLE PERMISSION
        // =========================================================

        private async Task<bool> HasClientPermissionAsync(
            ClaimsPrincipal user,
            string module,
            string action)
        {
            // =====================================================
            // CLIENT MEMBER ID
            // =====================================================

            var clientMemberId =
                GetClientMemberId(user);

            if (!clientMemberId.HasValue)
            {
                Console.WriteLine(
                    "[EPIC CLIENT AUTH] DENIED: " +
                    "clientMemberId missing from JWT.");

                return false;
            }

            Console.WriteLine(
                $"[EPIC CLIENT AUTH] " +
                $"ClientMemberId={clientMemberId.Value}");

            // =====================================================
            // LOOKUP PERMISSION
            // =====================================================

            var permission =
                await (
                    from clientMember
                        in _context.ClientMembers.AsNoTracking()

                    join clientRole
                        in _context.ClientRoles.AsNoTracking()
                        on clientMember.ClientRoleId
                        equals clientRole.ClientRoleId

                    join clientPermission
                        in _context.ClientPermissions.AsNoTracking()
                        on clientRole.ClientRoleId
                        equals clientPermission.ClientRoleId

                    where
                        clientMember.ClientMemberId ==
                            clientMemberId.Value

                        && clientMember.IsActive

                        && clientMember.Status != null

                        && clientMember.Status
                            .Trim()
                            .ToUpper() == "ACTIVE"

                        && clientRole.IsActive

                        // TENANT ISOLATION

                        && clientRole.CustomerId ==
                            clientMember.CustomerId

                        && clientPermission.ModuleName != null

                        && clientPermission.ModuleName
                            .Trim()
                            .ToUpper() ==
                            module.ToUpper()

                    select clientPermission
                )
                .FirstOrDefaultAsync();

            // =====================================================
            // PERMISSION NOT FOUND
            // =====================================================

            if (permission == null)
            {
                Console.WriteLine(
                    "[EPIC CLIENT AUTH] DENIED: " +
                    $"No permission found for " +
                    $"{module}:{action} " +
                    $"ClientMemberId={clientMemberId.Value}");

                return false;
            }

            // =====================================================
            // CHECK ACTION
            // =====================================================

            var allowed =
                HasClientPermissionAction(
                    permission,
                    action);

            Console.WriteLine(
                "[EPIC CLIENT AUTH] " +
                $"Module={module} " +
                $"Action={action} " +
                $"Allowed={allowed}");

            return allowed;
        }

        // =========================================================
        // CLIENT MEMBER ID
        // =========================================================

        private static int? GetClientMemberId(
            ClaimsPrincipal user)
        {
            if (user == null)
            {
                return null;
            }

            var possibleClaims =
                new[]
                {
                    "clientMemberId",
                    "ClientMemberId"
                };

            foreach (var claimName in possibleClaims)
            {
                var value =
                    user.FindFirst(claimName)?.Value;

                if (int.TryParse(
                    value,
                    out var id) &&
                    id > 0)
                {
                    return id;
                }
            }

            return null;
        }

        // =========================================================
        // GET USER ACCOUNT
        // =========================================================

        private async Task<UserAccountInfo?>
            GetAccountAsync(
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
        // NORMAL USER ROLE PERMISSION
        // =========================================================

        private async Task<bool>
            HasRolePermissionAsync(
                int roleId,
                string module,
                string action)
        {
            if (roleId <= 0)
            {
                return false;
            }

            var permission =
                await _context.Permissions
                    .AsNoTracking()
                    .Where(p =>
                        p.RoleId == roleId &&

                        p.Module != null &&

                        p.Module.Trim().ToUpper() ==
                            module.ToUpper())
                    .Select(p => new
                    {
                        p.CanView,
                        p.CanCreate,
                        p.CanEdit,
                        p.CanDelete,
                        p.CanExport
                    })
                    .FirstOrDefaultAsync();

            if (permission == null)
            {
                Console.WriteLine(
                    "[EPIC AUTH] " +
                    $"No role permission found. " +
                    $"RoleId={roleId}, Module={module}");

                return false;
            }

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

                "manage" =>
                    false,

                _ =>
                    false
            };
        }

        // =========================================================
        // CLIENT ACTION CHECK
        // =========================================================

        private static bool
            HasClientPermissionAction(
                ClientPermission permission,
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

                "manage" =>
                    permission.CanManage,

                "export" =>
                    false,

                _ =>
                    false
            };
        }

        // =========================================================
        // GET ROLE FROM JWT
        // =========================================================

        private static string?
            GetRole(
                ClaimsPrincipal user)
        {
            if (user == null)
            {
                return null;
            }

            return
                user.FindFirst(
                    ClaimTypes.Role)?.Value
                ??
                user.FindFirst(
                    "role")?.Value;
        }

        // =========================================================
        // CLIENT ROLE FAMILY
        // =========================================================

        private static bool IsClient(
            ClaimsPrincipal user)
        {
            var role =
                GetRole(user);

            if (string.IsNullOrWhiteSpace(role))
            {
                return false;
            }

            role =
                role.Trim();

            return
                role.Equals(
                    "CLIENT",
                    StringComparison.OrdinalIgnoreCase)
                ||
                role.StartsWith(
                    "CLIENT_",
                    StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // USER ID
        // =========================================================

        private static int? GetUserId(
            ClaimsPrincipal user)
        {
            if (user == null)
            {
                return null;
            }

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
                    user.FindFirst(
                        claimType)?.Value;

                if (int.TryParse(
                    value,
                    out var userId) &&
                    userId > 0)
                {
                    return userId;
                }
            }

            return null;
        }

        // =========================================================
        // ADMIN ROLE
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
        // APPROVAL STATUS
        // =========================================================

        private static bool IsApproved(
            string? status)
        {
            // Existing accounts with NULL approval
            // remain valid for backward compatibility.

            if (string.IsNullOrWhiteSpace(status))
            {
                return true;
            }

            return string.Equals(
                status.Trim(),
                "APPROVED",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // NORMALIZE MODULE
        // =========================================================

        private static string?
            NormalizeModule(
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

        private static string?
            NormalizeAction(
                string? action)
        {
            if (string.IsNullOrWhiteSpace(action))
            {
                return null;
            }

            var normalized =
                action.Trim()
                    .ToLowerInvariant();

            return AllowedActions.Contains(
                normalized)
                ? normalized
                : null;
        }

        // =========================================================
        // ACCOUNT DTO
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

