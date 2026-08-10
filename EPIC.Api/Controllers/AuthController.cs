using BCrypt.Net;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // =========================================================
        // REGISTER
        // POST: api/Auth/register
        // =========================================================

        [HttpPost("register")]
        public async Task<IActionResult> Register(
            UserRegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest("Username is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest("Full name is required.");

            string username = request.Username.Trim();

            bool usernameExists = await _context.Users
                .AnyAsync(u => u.Username == username);

            if (usernameExists)
            {
                return Conflict(new
                {
                    message = "Username already exists."
                });
            }

            string roleName =
                string.IsNullOrWhiteSpace(request.Role)
                    ? "STAFF"
                    : request.Role.Trim().ToUpper();

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleName.ToUpper() == roleName &&
                    r.IsActive);

            if (role == null)
            {
                return BadRequest(new
                {
                    message =
                        $"Role '{roleName}' does not exist or is inactive."
                });
            }

            int? memberId = request.MemberId;

            // =====================================================
            // MEMBER ACCOUNT
            // =====================================================

            if (roleName == "MEMBER")
            {
                if (!memberId.HasValue)
                {
                    return BadRequest(new
                    {
                        message =
                            "A MEMBER account must be linked to a registered member."
                    });
                }

                var member = await _context.Members
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m =>
                        m.MemberId == memberId.Value);

                if (member == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected member does not exist."
                    });
                }

                if (!string.Equals(
                        member.Status,
                        "ACTIVE",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message =
                            "Only active members can have a MEMBER account."
                    });
                }

                bool memberAlreadyHasAccount =
                    await _context.Users.AnyAsync(u =>
                        u.MemberId == memberId.Value &&
                        u.IsActive);

                if (memberAlreadyHasAccount)
                {
                    return Conflict(new
                    {
                        message =
                            "This member already has an active account."
                    });
                }
            }
            else
            {
                memberId = null;
            }

            string passwordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password);

            var user = new User
            {
                Username = username,
                PasswordHash = passwordHash,
                FullName = request.FullName.Trim(),
                RoleId = role.RoleId,
                MemberId = memberId,
                IsActive = true,
                CreatedDate = DateTime.Now
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "USER REGISTERED SUCCESSFULLY.",
                userId = user.UserId,
                username = user.Username,
                fullName = user.FullName,
                roleId = role.RoleId,
                role = role.RoleName,
                memberId = user.MemberId
            });
        }

        // =========================================================
        // LOGIN
        // POST: api/Auth/login
        // =========================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            UserLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest("Username is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            string username = request.Username.Trim();

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u =>
                    u.Username == username);

            if (user == null)
            {
                return Unauthorized(
                    "INVALID USERNAME OR PASSWORD.");
            }

            if (!user.IsActive)
            {
                return Unauthorized(
                    "THIS ACCOUNT IS INACTIVE.");
            }

            bool passwordValid =
                BCrypt.Net.BCrypt.Verify(
                    request.Password,
                    user.PasswordHash);

            if (!passwordValid)
            {
                return Unauthorized(
                    "INVALID USERNAME OR PASSWORD.");
            }

            if (user.Role == null)
            {
                return Unauthorized(
                    "USER ROLE IS NOT CONFIGURED.");
            }

            string roleName =
                user.Role.RoleName?.Trim().ToUpper() ?? "";

            // =====================================================
            // LOAD MEMBER DIRECTLY USING MemberId
            // =====================================================

            Member? member = null;

            if (user.MemberId.HasValue)
            {
                member = await _context.Members
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m =>
                        m.MemberId == user.MemberId.Value);
            }

            // =====================================================
            // MEMBER VALIDATION
            // =====================================================

            if (roleName == "MEMBER")
            {
                if (!user.MemberId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message =
                            "This MEMBER account is not linked to a member record.",
                        userId = user.UserId,
                        username = user.Username,
                        memberId = (int?)null
                    });
                }

                if (member == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "The linked member record could not be found.",
                        userId = user.UserId,
                        memberId = user.MemberId
                    });
                }

                if (!string.Equals(
                        member.Status,
                        "ACTIVE",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Unauthorized(new
                    {
                        message =
                            "The linked member account is inactive.",
                        userId = user.UserId,
                        memberId = user.MemberId
                    });
                }
            }

            string token =
                GenerateJwtToken(user);

            return Ok(new
            {
                message = "LOGIN SUCCESSFUL.",
                userId = user.UserId,
                username = user.Username,
                fullName = user.FullName,
                roleId = user.RoleId,
                role = user.Role.RoleName,
                memberId = user.MemberId,

                member = member == null
                    ? null
                    : new
                    {
                        memberId = member.MemberId,
                        memberCode = member.MemberCode,
                        firstName = member.FirstName,
                        middleName = member.MiddleName,
                        lastName = member.LastName,
                        fullName =
                            (
                                member.FirstName + " " +
                                member.MiddleName + " " +
                                member.LastName
                            ).Trim(),
                        status = member.Status,
                        photoPath = member.PhotoPath
                    },

                token = token
            });
        }

        // =========================================================
        // GET CURRENT USER PERMISSIONS
        // GET: api/Auth/permissions
        // =========================================================

        [HttpGet("permissions")]
        [Authorize]
        public async Task<IActionResult>
            GetCurrentUserPermissions()
        {
            var userIdClaim =
                User.FindFirst(
                    ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return Unauthorized(new
                {
                    message =
                        "USER ID CLAIM IS MISSING."
                });
            }

            if (!int.TryParse(
                    userIdClaim.Value,
                    out int userId))
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID USER ID CLAIM."
                });
            }

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u =>
                    u.UserId == userId);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message =
                        "USER NOT FOUND."
                });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "USER ACCOUNT IS INACTIVE."
                });
            }

            string roleName =
                user.Role?.RoleName?.Trim() ?? "";

            // =====================================================
            // MEMBER ID
            // =====================================================

            int? memberId =
                user.MemberId;

            // =====================================================
            // LOAD MEMBER DIRECTLY
            // =====================================================

            Member? member = null;

            if (memberId.HasValue)
            {
                member = await _context.Members
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m =>
                        m.MemberId == memberId.Value);
            }

            // =====================================================
            // MEMBER ACCOUNT VALIDATION
            // =====================================================

            if (string.Equals(
                    roleName,
                    "MEMBER",
                    StringComparison.OrdinalIgnoreCase))
            {
                if (!memberId.HasValue)
                {
                    return Unauthorized(new
                    {
                        message =
                            "This MEMBER account is not linked to a member record.",
                        userId = user.UserId,
                        username = user.Username,
                        role = roleName,
                        memberId = (int?)null
                    });
                }

                if (member == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "The MEMBER ID exists, but the member record could not be found.",
                        userId = user.UserId,
                        username = user.Username,
                        role = roleName,
                        memberId = memberId
                    });
                }

                if (!string.Equals(
                        member.Status,
                        "ACTIVE",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Unauthorized(new
                    {
                        message =
                            "The linked member account is inactive.",
                        userId = user.UserId,
                        memberId = memberId
                    });
                }
            }

            // =====================================================
            // GET PERMISSIONS
            // =====================================================

            var permissions =
                await GetPermissionsForRole(
                    user.RoleId);

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                userId = user.UserId,
                username = user.Username,
                fullName = user.FullName,
                roleId = user.RoleId,
                role = roleName,
                memberId = memberId,

                member = member == null
                    ? null
                    : new
                    {
                        memberId = member.MemberId,
                        memberCode = member.MemberCode,
                        firstName = member.FirstName,
                        middleName = member.MiddleName,
                        lastName = member.LastName,
                        fullName =
                            (
                                member.FirstName + " " +
                                member.MiddleName + " " +
                                member.LastName
                            ).Trim(),
                        status = member.Status,
                        photoPath = member.PhotoPath
                    },

                permissions = permissions
            });
        }

        // =========================================================
        // GET PERMISSIONS FOR ROLE
        // =========================================================

        private async Task<List<PermissionResponse>>
            GetPermissionsForRole(
                int roleId)
        {
            return await _context.Permissions
                .AsNoTracking()
                .Where(p =>
                    p.RoleId == roleId)
                .Select(p => new PermissionResponse
                {
                    module = p.Module,
                    view = p.CanView,
                    create = p.CanCreate,
                    edit = p.CanEdit,
                    delete = p.CanDelete,
                    export = p.CanExport
                })
                .ToListAsync();
        }

        // =========================================================
        // GENERATE JWT
        // =========================================================

        private string GenerateJwtToken(
            User user)
        {
            var key =
                _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException(
                    "JWT Key is not configured.");
            }

            var issuer =
                _configuration["Jwt:Issuer"];

            var audience =
                _configuration["Jwt:Audience"];

            var expirationMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpirationMinutes");

            string roleName =
                user.Role?.RoleName ?? "STAFF";

            var claims =
                new List<Claim>
                {
                    new Claim(
                        ClaimTypes.NameIdentifier,
                        user.UserId.ToString()),

                    new Claim(
                        ClaimTypes.Name,
                        user.Username),

                    new Claim(
                        ClaimTypes.GivenName,
                        user.FullName),

                    new Claim(
                        ClaimTypes.Role,
                        roleName)
                };

            // =====================================================
            // MEMBER ID CLAIM
            // =====================================================

            if (user.MemberId.HasValue)
            {
                claims.Add(
                    new Claim(
                        "MemberId",
                        user.MemberId.Value.ToString()));
            }

            var securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key));

            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256);

            var token =
                new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires:
                        DateTime.UtcNow.AddMinutes(
                            expirationMinutes),
                    signingCredentials:
                        credentials);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }

    // =============================================================
    // PERMISSION RESPONSE
    // =============================================================

    public class PermissionResponse
    {
        public string module { get; set; } = "";

        public bool view { get; set; }

        public bool create { get; set; }

        public bool edit { get; set; }

        public bool delete { get; set; }

        public bool export { get; set; }
    }

    // =============================================================
    // REGISTER REQUEST
    // =============================================================

    public class UserRegisterRequest
    {
        public string Username { get; set; }
            = string.Empty;

        public string Password { get; set; }
            = string.Empty;

        public string FullName { get; set; }
            = string.Empty;

        public string Role { get; set; }
            = "STAFF";

        public int? MemberId { get; set; }
    }

    // =============================================================
    // LOGIN REQUEST
    // =============================================================

    public class UserLoginRequest
    {
        public string Username { get; set; }
            = string.Empty;

        public string Password { get; set; }
            = string.Empty;
    }
}