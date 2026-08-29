
using EPIC.Api.Models;

namespace EPIC.Api.Services
{
    /// <summary>
    /// Resolves permissions for authenticated client members.
    ///
    /// Security chain:
    ///
    /// ClientMember
    ///     ↓
    /// ClientRoleId + CustomerId
    ///     ↓
    /// ClientRole
    ///     ↓
    /// ClientPermissions
    ///
    /// Permissions are loaded in bulk and cached briefly to prevent
    /// repeated database queries for the same client role.
    /// </summary>
    public interface IClientPermissionService
    {
        // =========================================================
        // SINGLE PERMISSION CHECKS
        // =========================================================

        Task<bool> CanViewAsync(
            int clientRoleId,
            int customerId,
            string moduleName);

        Task<bool> CanCreateAsync(
            int clientRoleId,
            int customerId,
            string moduleName);

        Task<bool> CanEditAsync(
            int clientRoleId,
            int customerId,
            string moduleName);

        Task<bool> CanDeleteAsync(
            int clientRoleId,
            int customerId,
            string moduleName);

        Task<bool> CanManageAsync(
            int clientRoleId,
            int customerId,
            string moduleName);

        // =========================================================
        // GENERAL PERMISSION CHECK
        // =========================================================

        Task<bool> HasPermissionAsync(
            int clientRoleId,
            int customerId,
            string moduleName,
            string permission);

        // =========================================================
        // BULK PERMISSIONS
        //
        // IMPORTANT:
        //
        // Loads ALL permissions for the client role in one query.
        // =========================================================

        Task<IReadOnlyDictionary<string, ClientPermission>>
            GetPermissionsAsync(
                int clientRoleId,
                int customerId);

        // =========================================================
        // ROLE VALIDATION
        // =========================================================

        Task<bool> IsValidClientRoleAsync(
            int clientRoleId,
            int customerId);

        // =========================================================
        // SINGLE MODULE PERMISSION
        // =========================================================

        Task<ClientPermission?> GetPermissionAsync(
            int clientRoleId,
            int customerId,
            string moduleName);

        // =========================================================
        // CACHE INVALIDATION
        //
        // Call this after changing a client's permissions/role.
        // =========================================================

        void ClearPermissionsCache(
            int clientRoleId,
            int customerId);
    }
}

