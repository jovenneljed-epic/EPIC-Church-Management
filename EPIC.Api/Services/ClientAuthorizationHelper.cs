
using System.Security.Claims;

namespace EPIC.Api.Services
{
    /// <summary>
    /// Helper methods for extracting authenticated client
    /// information from the JWT.
    /// </summary>
    public static class ClientAuthorizationHelper
    {
        // =========================================================
        // GET CLIENT MEMBER ID
        // =========================================================

        public static int? GetClientMemberId(
            ClaimsPrincipal user)
        {
            return GetIntClaim(
                user,
                "clientMemberId");
        }

        // =========================================================
        // GET CUSTOMER ID
        // =========================================================

        public static int? GetCustomerId(
            ClaimsPrincipal user)
        {
            // Prefer lowercase custom claim.
            var customerId =
                GetIntClaim(
                    user,
                    "customerId");

            if (customerId.HasValue)
            {
                return customerId;
            }

            // Fallback to uppercase claim.
            return GetIntClaim(
                user,
                "CustomerId");
        }

        // =========================================================
        // GET MEMBER ID
        // =========================================================

        public static int? GetMemberId(
            ClaimsPrincipal user)
        {
            var memberId =
                GetIntClaim(
                    user,
                    "memberId");

            if (memberId.HasValue)
            {
                return memberId;
            }

            return GetIntClaim(
                user,
                "MemberId");
        }

        // =========================================================
        // GET CLIENT ROLE ID
        // =========================================================

        public static int? GetClientRoleId(
            ClaimsPrincipal user)
        {
            return GetIntClaim(
                user,
                "clientRoleId");
        }

        // =========================================================
        // GET CLIENT ROLE NAME
        // =========================================================

        public static string? GetClientRoleName(
            ClaimsPrincipal user)
        {
            var claim =
                user.FindFirst(
                    "clientRoleName");

            if (claim == null)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(
                    claim.Value))
            {
                return null;
            }

            return claim.Value.Trim();
        }

        // =========================================================
        // GET USERNAME
        // =========================================================

        public static string? GetUsername(
            ClaimsPrincipal user)
        {
            var claim =
                user.FindFirst(
                    ClaimTypes.Name);

            if (claim == null)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(
                    claim.Value))
            {
                return null;
            }

            return claim.Value.Trim();
        }

        // =========================================================
        // IS CLIENT
        // =========================================================

        public static bool IsClient(
            ClaimsPrincipal user)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            return user.IsInRole("CLIENT");
        }

        // =========================================================
        // GET INTEGER CLAIM
        // =========================================================

        private static int? GetIntClaim(
            ClaimsPrincipal user,
            string claimType)
        {
            var claim =
                user.FindFirst(claimType);

            if (claim == null)
            {
                return null;
            }

            if (int.TryParse(
                    claim.Value,
                    out var value))
            {
                return value;
            }

            return null;
        }
    }
}

