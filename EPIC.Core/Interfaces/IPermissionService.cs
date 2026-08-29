
using System.Security.Claims;

namespace EPIC.Core.Interfaces
{
    public interface IPermissionService
    {
        // =========================================================
        // SINGLE PERMISSION CHECK
        // =========================================================

        Task<bool> HasPermissionAsync(
            ClaimsPrincipal user,
            string module,
            string action);

        // =========================================================
        // SINGLE PERMISSION CHECK BY USER ID
        // =========================================================

        Task<bool> HasPermissionAsync(
            int userId,
            string module,
            string action);

        // =========================================================
        // ADMIN CHECK
        // =========================================================

        Task<bool> IsAdminAsync(
            ClaimsPrincipal user);

        // =========================================================
        // BULK CLIENT PERMISSIONS
        //
        // Loads all permissions for the authenticated client
        // in ONE database query.
        // =========================================================

        Task<IReadOnlyDictionary<string, ClientPermissionDto>>
            GetClientPermissionsAsync(
                ClaimsPrincipal user);
    }

    // =============================================================
    // CLIENT PERMISSION DTO
    // =============================================================

    public sealed class ClientPermissionDto
    {
        public string ModuleName { get; init; } =
            string.Empty;

        public bool CanView { get; init; }

        public bool CanCreate { get; init; }

        public bool CanEdit { get; init; }

        public bool CanDelete { get; init; }

        public bool CanManage { get; init; }
    }
}

