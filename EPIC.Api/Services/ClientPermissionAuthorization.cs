
using System.Security.Claims;

namespace EPIC.Api.Services
{
    /// <summary>
    /// Centralized authorization logic for Client Portal
    /// module permissions.
    /// </summary>
    public class ClientPermissionAuthorization
    {
        private readonly IClientPermissionService _permissionService;

        public ClientPermissionAuthorization(
            IClientPermissionService permissionService)
        {
            _permissionService =
                permissionService;
        }

        // =========================================================
        // VIEW
        // =========================================================

        public async Task<bool> CanViewAsync(
            ClaimsPrincipal user,
            string moduleName)
        {
            var context =
                GetClientContext(user);

            if (context == null)
            {
                return false;
            }

            return await _permissionService
                .CanViewAsync(
                    context.ClientRoleId,
                    context.CustomerId,
                    moduleName);
        }

        // =========================================================
        // CREATE
        // =========================================================

        public async Task<bool> CanCreateAsync(
            ClaimsPrincipal user,
            string moduleName)
        {
            var context =
                GetClientContext(user);

            if (context == null)
            {
                return false;
            }

            return await _permissionService
                .CanCreateAsync(
                    context.ClientRoleId,
                    context.CustomerId,
                    moduleName);
        }

        // =========================================================
        // EDIT
        // =========================================================

        public async Task<bool> CanEditAsync(
            ClaimsPrincipal user,
            string moduleName)
        {
            var context =
                GetClientContext(user);

            if (context == null)
            {
                return false;
            }

            return await _permissionService
                .CanEditAsync(
                    context.ClientRoleId,
                    context.CustomerId,
                    moduleName);
        }

        // =========================================================
        // DELETE
        // =========================================================

        public async Task<bool> CanDeleteAsync(
            ClaimsPrincipal user,
            string moduleName)
        {
            var context =
                GetClientContext(user);

            if (context == null)
            {
                return false;
            }

            return await _permissionService
                .CanDeleteAsync(
                    context.ClientRoleId,
                    context.CustomerId,
                    moduleName);
        }

        // =========================================================
        // MANAGE
        // =========================================================

        public async Task<bool> CanManageAsync(
            ClaimsPrincipal user,
            string moduleName)
        {
            var context =
                GetClientContext(user);

            if (context == null)
            {
                return false;
            }

            return await _permissionService
                .CanManageAsync(
                    context.ClientRoleId,
                    context.CustomerId,
                    moduleName);
        }

        // =========================================================
        // CLIENT CONTEXT
        // =========================================================

        public static ClientAuthorizationContext?
            GetClientContext(
                ClaimsPrincipal user)
        {
            if (!ClientAuthorizationHelper
                    .IsClient(user))
            {
                return null;
            }

            var clientRoleId =
                ClientAuthorizationHelper
                    .GetClientRoleId(user);

            var customerId =
                ClientAuthorizationHelper
                    .GetCustomerId(user);

            var clientMemberId =
                ClientAuthorizationHelper
                    .GetClientMemberId(user);

            if (!clientRoleId.HasValue ||
                clientRoleId.Value <= 0)
            {
                return null;
            }

            if (!customerId.HasValue ||
                customerId.Value <= 0)
            {
                return null;
            }

            if (!clientMemberId.HasValue ||
                clientMemberId.Value <= 0)
            {
                return null;
            }

            return new ClientAuthorizationContext
            {
                ClientMemberId =
                    clientMemberId.Value,

                CustomerId =
                    customerId.Value,

                ClientRoleId =
                    clientRoleId.Value
            };
        }
    }

    // =============================================================
    // CLIENT AUTHORIZATION CONTEXT
    // =============================================================

    public class ClientAuthorizationContext
    {
        public int ClientMemberId { get; set; }

        public int CustomerId { get; set; }

        public int ClientRoleId { get; set; }
    }
}

