
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
using EPIC.Core.Interfaces;

using System.Collections.Concurrent;

namespace EPIC.Api.Services
{
    /// <summary>
    /// Resolves permissions for authenticated client members.
    ///
    /// Security chain:
    ///
    /// ClientMember
    ///      ↓
    /// ClientRoleId + CustomerId
    ///      ↓
    /// ClientRole
    ///      ↓
    /// ClientPermissions
    ///
    /// Performance:
    ///
    /// - Permissions are loaded in ONE database query.
    /// - Results are cached briefly.
    /// - Repeated permission checks do NOT repeatedly query SQL Server.
    /// - CustomerId is always validated against the ClientRole.
    /// </summary>
    public class ClientPermissionService : IClientPermissionService
    {
        private readonly ApplicationDbContext _context;

        // =========================================================
        // CACHE
        // =========================================================

        private sealed class PermissionCacheEntry
        {
            public IReadOnlyDictionary<string, ClientPermission> Permissions { get; }
            public DateTime ExpiresAtUtc { get; }

            public PermissionCacheEntry(
                IReadOnlyDictionary<string, ClientPermission> permissions,
                DateTime expiresAtUtc)
            {
                Permissions = permissions;
                ExpiresAtUtc = expiresAtUtc;
            }
        }

        private readonly ConcurrentDictionary<string, PermissionCacheEntry>
            _permissionsCache = new();

        // Cache lifetime.
        //
        // 2 minutes is intentionally short enough that permission
        // changes do not remain stale for a long time.
        private static readonly TimeSpan CacheDuration =
            TimeSpan.FromMinutes(2);

        public ClientPermissionService(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // VIEW
        // =========================================================

        public Task<bool> CanViewAsync(
            int clientRoleId,
            int customerId,
            string moduleName)
        {
            return HasPermissionAsync(
                clientRoleId,
                customerId,
                moduleName,
                "VIEW");
        }

        // =========================================================
        // CREATE
        // =========================================================

        public Task<bool> CanCreateAsync(
            int clientRoleId,
            int customerId,
            string moduleName)
        {
            return HasPermissionAsync(
                clientRoleId,
                customerId,
                moduleName,
                "CREATE");
        }

        // =========================================================
        // EDIT
        // =========================================================

        public Task<bool> CanEditAsync(
            int clientRoleId,
            int customerId,
            string moduleName)
        {
            return HasPermissionAsync(
                clientRoleId,
                customerId,
                moduleName,
                "EDIT");
        }

        // =========================================================
        // DELETE
        // =========================================================

        public Task<bool> CanDeleteAsync(
            int clientRoleId,
            int customerId,
            string moduleName)
        {
            return HasPermissionAsync(
                clientRoleId,
                customerId,
                moduleName,
                "DELETE");
        }

        // =========================================================
        // MANAGE
        // =========================================================

        public Task<bool> CanManageAsync(
            int clientRoleId,
            int customerId,
            string moduleName)
        {
            return HasPermissionAsync(
                clientRoleId,
                customerId,
                moduleName,
                "MANAGE");
        }

        // =========================================================
        // GENERAL PERMISSION CHECK
        //
        // IMPORTANT:
        //
        // This uses the bulk permission cache.
        //
        // It does NOT execute a SQL query every time.
        // =========================================================

        public async Task<bool> HasPermissionAsync(
            int clientRoleId,
            int customerId,
            string moduleName,
            string permission)
        {
            if (clientRoleId <= 0 ||
                customerId <= 0 ||
                string.IsNullOrWhiteSpace(moduleName) ||
                string.IsNullOrWhiteSpace(permission))
            {
                return false;
            }

            var permissions =
                await GetPermissionsAsync(
                    clientRoleId,
                    customerId);

            var normalizedModule =
                moduleName.Trim();

            if (!permissions.TryGetValue(
                    normalizedModule,
                    out var clientPermission))
            {
                return false;
            }

            var normalizedPermission =
                permission.Trim().ToUpperInvariant();

            return normalizedPermission switch
            {
                "VIEW" =>
                    clientPermission.CanView,

                "CREATE" =>
                    clientPermission.CanCreate,

                "EDIT" =>
                    clientPermission.CanEdit,

                "DELETE" =>
                    clientPermission.CanDelete,

                "MANAGE" =>
                    clientPermission.CanManage,

                _ => false
            };
        }

        // =========================================================
        // BULK PERMISSIONS
        //
        // ONE DATABASE QUERY
        // =========================================================

        public async Task<IReadOnlyDictionary<string, ClientPermission>>
            GetPermissionsAsync(
                int clientRoleId,
                int customerId)
        {
            if (clientRoleId <= 0 ||
                customerId <= 0)
            {
                return new Dictionary<string, ClientPermission>(
                    StringComparer.OrdinalIgnoreCase);
            }

            var cacheKey =
                BuildCacheKey(
                    clientRoleId,
                    customerId);

            // =====================================================
            // CHECK CACHE
            // =====================================================

            if (_permissionsCache.TryGetValue(
                    cacheKey,
                    out var cached))
            {
                if (cached.ExpiresAtUtc > DateTime.UtcNow)
                {
                    return cached.Permissions;
                }

                // Remove expired cache entry.
                _permissionsCache.TryRemove(
                    cacheKey,
                    out _);
            }

            // =====================================================
            // ONE QUERY
            //
            // The ClientRole relationship verifies:
            //
            // ClientRoleId
            // CustomerId
            // IsActive
            //
            // The permission records are then loaded.
            // =====================================================

            var permissions =
                await _context.ClientPermissions
                    .AsNoTracking()
                    .Where(permission =>
                        permission.ClientRoleId ==
                            clientRoleId &&

                        permission.ClientRole != null &&

                        permission.ClientRole.CustomerId ==
                            customerId &&

                        permission.ClientRole.IsActive)
                    .ToListAsync();

            // =====================================================
            // CONVERT TO DICTIONARY
            // =====================================================

            var dictionary =
                permissions
                    .Where(permission =>
                        !string.IsNullOrWhiteSpace(
                            permission.ModuleName))
                    .GroupBy(permission =>
                        permission.ModuleName.Trim(),
                        StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        group => group.Key,
                        group => group.First(),
                        StringComparer.OrdinalIgnoreCase);

            IReadOnlyDictionary<string, ClientPermission>
                readOnlyDictionary =
                    dictionary;

            // =====================================================
            // CACHE RESULT
            // =====================================================

            _permissionsCache[cacheKey] =
                new PermissionCacheEntry(
                    readOnlyDictionary,
                    DateTime.UtcNow.Add(
                        CacheDuration));

            return readOnlyDictionary;
        }

        // =========================================================
        // ROLE VALIDATION
        // =========================================================

        public async Task<bool> IsValidClientRoleAsync(
            int clientRoleId,
            int customerId)
        {
            if (clientRoleId <= 0 ||
                customerId <= 0)
            {
                return false;
            }

            return await _context.ClientRoles
                .AsNoTracking()
                .AnyAsync(role =>
                    role.ClientRoleId ==
                        clientRoleId &&

                    role.CustomerId ==
                        customerId &&

                    role.IsActive);
        }

        // =========================================================
        // SINGLE MODULE PERMISSION
        // =========================================================

        public async Task<ClientPermission?> GetPermissionAsync(
            int clientRoleId,
            int customerId,
            string moduleName)
        {
            if (clientRoleId <= 0 ||
                customerId <= 0 ||
                string.IsNullOrWhiteSpace(moduleName))
            {
                return null;
            }

            var permissions =
                await GetPermissionsAsync(
                    clientRoleId,
                    customerId);

            permissions.TryGetValue(
                moduleName.Trim(),
                out var permission);

            return permission;
        }

        // =========================================================
        // CLEAR CACHE
        //
        // Call this whenever:
        //
        // - Client permission changes
        // - Client role changes
        // - Permission is added
        // - Permission is deleted
        // =========================================================

        public void ClearPermissionsCache(
            int clientRoleId,
            int customerId)
        {
            if (clientRoleId <= 0 ||
                customerId <= 0)
            {
                return;
            }

            var cacheKey =
                BuildCacheKey(
                    clientRoleId,
                    customerId);

            _permissionsCache.TryRemove(
                cacheKey,
                out _);
        }

        // =========================================================
        // CACHE KEY
        // =========================================================

        private static string BuildCacheKey(
            int clientRoleId,
            int customerId)
        {
            return $"{customerId}:{clientRoleId}";
        }
    }
}

