using System.Security.Claims;

namespace EPIC.Api.Services
{
    public interface ICurrentUserService
    {
        int? UserId { get; }
        int? CustomerId { get; }
        int? MemberId { get; }

        string? Username { get; }
        string? Role { get; }
        string? AccountType { get; }

        bool IsAuthenticated { get; }
        bool IsSystemUser { get; }
        bool IsClient { get; }
        bool IsMember { get; }
        bool IsStaff { get; }
    }

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User =>
            _httpContextAccessor.HttpContext?.User;

        public bool IsAuthenticated =>
            User?.Identity?.IsAuthenticated == true;

        public int? UserId =>
            GetIntClaim(
                ClaimTypes.NameIdentifier,
                "userId");

        public int? CustomerId =>
            GetIntClaim(
                "customerId",
                "CustomerId");

        public int? MemberId =>
            GetIntClaim(
                "memberId",
                "MemberId");

        public string? Username =>
            User?.FindFirst(
                ClaimTypes.Name)?.Value;

        public string? Role =>
            User?.FindFirst(
                ClaimTypes.Role)?.Value
            ??
            User?.FindFirst(
                "role")?.Value;

        public string? AccountType =>
            User?.FindFirst(
                "accountType")?.Value;

        public bool IsSystemUser =>
            string.Equals(
                AccountType,
                "SYSTEM",
                StringComparison.OrdinalIgnoreCase);

        public bool IsClient =>
            string.Equals(
                AccountType,
                "CLIENT",
                StringComparison.OrdinalIgnoreCase);

        public bool IsMember =>
            string.Equals(
                AccountType,
                "MEMBER",
                StringComparison.OrdinalIgnoreCase);

        public bool IsStaff =>
            string.Equals(
                AccountType,
                "STAFF",
                StringComparison.OrdinalIgnoreCase);

        private int? GetIntClaim(params string[] claimTypes)
        {
            if (User == null)
                return null;

            foreach (var claimType in claimTypes)
            {
                var value =
                    User.FindFirst(claimType)?.Value;

                if (int.TryParse(value, out var result))
                    return result;
            }

            return null;
        }
    }
}