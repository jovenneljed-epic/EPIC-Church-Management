using System.Security.Claims;

namespace EPIC.Core.Interfaces
{
    public interface IPermissionService
    {
        Task<bool> HasPermissionAsync(
            ClaimsPrincipal user,
            string module,
            string action);

        Task<bool> HasPermissionAsync(
            int userId,
            string module,
            string action);

        Task<bool> IsAdminAsync(
            ClaimsPrincipal user);
    }
}