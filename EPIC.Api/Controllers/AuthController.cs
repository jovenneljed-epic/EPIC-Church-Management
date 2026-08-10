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
        // REGISTER MEMBER ACCOUNT
        // POST: api/Auth/register
        // =========================================================

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(
            [FromBody] UserRegisterRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Registration data is required."
                });
            }

            // =====================================================
            // VALIDATION
            // =====================================================

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new
                {
                    message = "Username is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new
                {
                    message = "Full name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.MemberCode))
            {
                return BadRequest(new
                {
                    message = "Member Code is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.LastName))
            {
                return BadRequest(new
                {
                    message = "Last name is required."
                });
            }

            string username = request.Username.Trim();
            string memberCode = request.MemberCode.Trim();
            string lastName = request.LastName.Trim();

            // =====================================================
            // USERNAME CHECK
            // Case-insensitive
            // =====================================================

            string normalizedUsername =
                username.ToLower();

            bool usernameExists =
                await _context.Users.AnyAsync(u =>
                    u.Username != null &&
                    u.Username.ToLower() == normalizedUsername);

            if (usernameExists)
            {
                return Conflict(new
                {
                    message = "Username already exists."
                });
            }

            // =====================================================
            // FIND MEMBER
            //
            // MemberCode + LastName identify the member.
            //
            // MemberId supplied by client is NEVER trusted.
            // =====================================================

            string normalizedMemberCode =
                memberCode.ToLower();

            string normalizedLastName =
                lastName.ToLower();

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.MemberCode != null &&
                        m.LastName != null &&
                        m.MemberCode.ToLower() ==
                            normalizedMemberCode &&
                        m.LastName.ToLower() ==
                            normalizedLastName);

            if (member == null)
            {
                return BadRequest(new
                {
                    message =
                        "Member Code and Last Name do not match any registered member."
                });
            }

            // =====================================================
            // MEMBER STATUS
            // =====================================================

            if (!string.Equals(
                    member.Status?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message =
                        "Only ACTIVE members can create an account."
                });
            }

            // =====================================================
            // CHECK EXISTING MEMBER ACCOUNT
            // =====================================================

            bool memberAlreadyHasAccount =
                await _context.Users.AnyAsync(u =>
                    u.MemberId.HasValue &&
                    u.MemberId.Value == member.MemberId);

            if (memberAlreadyHasAccount)
            {
                return Conflict(new
                {
                    message =
                        "This member already has an account or has a pending account approval."
                });
            }

            // =====================================================
            // FIND MEMBER ROLE
            // =====================================================

            var role =
                await _context.Roles
                    .FirstOrDefaultAsync(r =>
                        r.RoleName != null &&
                        r.RoleName.ToLower() == "member" &&
                        r.IsActive);

            if (role == null)
            {
                return BadRequest(new
                {
                    message =
                        "MEMBER role does not exist or is inactive."
                });
            }

            // =====================================================
            // PASSWORD HASH
            // =====================================================

            string passwordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password);

            // =====================================================
            // CREATE PENDING USER
            // =====================================================

            var user = new User
            {
                Username = username,

                PasswordHash = passwordHash,

                FullName = request.FullName.Trim(),

                RoleId = role.RoleId,

                MemberId = member.MemberId,

                IsActive = false,

                ApprovalStatus = "PENDING",

                CreatedDate = DateTime.Now
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "ACCOUNT CREATED SUCCESSFULLY. YOUR ACCOUNT IS WAITING FOR ADMIN APPROVAL.",

                status = "PENDING",

                userId = user.UserId,

                username = user.Username,

                fullName = user.FullName,

                roleId = role.RoleId,

                role = role.RoleName,

                memberId = member.MemberId,

                memberCode = member.MemberCode
            });
        }

        // =========================================================
        // LOGIN
        // POST: api/Auth/login
        // =========================================================

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] UserLoginRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Login data is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new
                {
                    message = "Username is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            string username =
                request.Username.Trim();

            // IMPORTANT:
            // Do NOT trim the password.
            //
            // Passwords may intentionally contain spaces.

            string password =
                request.Password;

            // =====================================================
            // FIND USER
            // Case-insensitive username
            // =====================================================

            string normalizedUsername =
                username.ToLower();

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.Username != null &&
                        u.Username.ToLower() ==
                            normalizedUsername);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID USERNAME OR PASSWORD."
                });
            }

            // =====================================================
            // PASSWORD HASH CHECK
            // =====================================================

            if (string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID USERNAME OR PASSWORD."
                });
            }

            bool passwordValid;

            try
            {
                passwordValid =
                    BCrypt.Net.BCrypt.Verify(
                        password,
                        user.PasswordHash);
            }
            catch
            {
                passwordValid = false;
            }

            if (!passwordValid)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID USERNAME OR PASSWORD."
                });
            }

            // =====================================================
            // APPROVAL STATUS
            //
            // Existing ADMIN/STAFF accounts may have NULL
            // ApprovalStatus. Those accounts are treated as
            // already approved.
            // =====================================================

            string approvalStatus =
                string.IsNullOrWhiteSpace(user.ApprovalStatus)
                    ? "APPROVED"
                    : user.ApprovalStatus.Trim().ToUpper();

            // =====================================================
            // PENDING
            // =====================================================

            if (approvalStatus == "PENDING")
            {
                return Unauthorized(new
                {
                    message =
                        "YOUR ACCOUNT IS PENDING ADMIN APPROVAL.",

                    status = "PENDING"
                });
            }

            // =====================================================
            // REJECTED
            // =====================================================

            if (approvalStatus == "REJECTED")
            {
                return Unauthorized(new
                {
                    message =
                        "YOUR ACCOUNT REGISTRATION WAS REJECTED BY THE ADMIN.",

                    status = "REJECTED"
                });
            }

            // =====================================================
            // ACTIVE CHECK
            // =====================================================

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "THIS ACCOUNT IS INACTIVE."
                });
            }

            // =====================================================
            // ROLE CHECK
            // =====================================================

            if (user.Role == null)
            {
                return Unauthorized(new
                {
                    message =
                        "USER ROLE IS NOT CONFIGURED."
                });
            }

            string roleName =
                user.Role.RoleName?
                    .Trim()
                    .ToUpper() ?? "";

            // =====================================================
            // LOAD MEMBER
            // =====================================================

            Member? member = null;

            if (user.MemberId.HasValue)
            {
                member =
                    await _context.Members
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m =>
                            m.MemberId ==
                            user.MemberId.Value);
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

                        userId =
                            user.UserId,

                        username =
                            user.Username,

                        memberId =
                            (int?)null
                    });
                }

                if (member == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "The linked member record could not be found.",

                        userId =
                            user.UserId,

                        memberId =
                            user.MemberId
                    });
                }

                if (!string.Equals(
                        member.Status?.Trim(),
                        "ACTIVE",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Unauthorized(new
                    {
                        message =
                            "The linked member account is inactive.",

                        userId =
                            user.UserId,

                        memberId =
                            user.MemberId
                    });
                }
            }

            // =====================================================
            // GENERATE JWT
            // =====================================================

            string token =
                GenerateJwtToken(user);

            // =====================================================
            // LOGIN RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "LOGIN SUCCESSFUL.",

                userId =
                    user.UserId,

                username =
                    user.Username,

                fullName =
                    user.FullName,

                roleId =
                    user.RoleId,

                role =
                    user.Role.RoleName,

                memberId =
                    user.MemberId,

                approvalStatus =
                    approvalStatus,

                member =
                    member == null
                        ? null
                        : new
                        {
                            memberId =
                                member.MemberId,

                            memberCode =
                                member.MemberCode,

                            firstName =
                                member.FirstName,

                            middleName =
                                member.MiddleName,

                            lastName =
                                member.LastName,

                            fullName =
                                BuildMemberFullName(
                                    member.FirstName,
                                    member.MiddleName,
                                    member.LastName),

                            status =
                                member.Status,

                            photoPath =
                                member.PhotoPath
                        },

                token =
                    token
            });
        }

        // =========================================================
        // GET PENDING MEMBER ACCOUNTS
        //
        // GET: api/Auth/pending-members
        //
        // ADMIN ONLY
        // =========================================================

        [HttpGet("pending-members")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult>
            GetPendingMemberAccounts()
        {
            var pendingUsers =
                await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .Include(u => u.Member)
                    .Where(u =>
                        u.ApprovalStatus != null &&
                        u.ApprovalStatus.ToUpper() == "PENDING" &&
                        u.Role != null &&
                        u.Role.RoleName != null &&
                        u.Role.RoleName.ToUpper() == "MEMBER")
                    .OrderBy(u => u.CreatedDate)
                    .Select(u => new
                    {
                        userId =
                            u.UserId,

                        username =
                            u.Username,

                        fullName =
                            u.FullName,

                        memberId =
                            u.MemberId,

                        memberCode =
                            u.Member != null
                                ? u.Member.MemberCode
                                : null,

                        firstName =
                            u.Member != null
                                ? u.Member.FirstName
                                : null,

                        middleName =
                            u.Member != null
                                ? u.Member.MiddleName
                                : null,

                        lastName =
                            u.Member != null
                                ? u.Member.LastName
                                : null,

                        approvalStatus =
                            u.ApprovalStatus,

                        createdDate =
                            u.CreatedDate
                    })
                    .ToListAsync();

            return Ok(pendingUsers);
        }

        // =========================================================
        // APPROVE MEMBER ACCOUNT
        //
        // POST: api/Auth/approve-member/{userId}
        //
        // ADMIN ONLY
        // =========================================================

        [HttpPost("approve-member/{userId:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult>
            ApproveMemberAccount(int userId)
        {
            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "USER ACCOUNT NOT FOUND."
                });
            }

            string roleName =
                user.Role?.RoleName?
                    .Trim()
                    .ToUpper() ?? "";

            if (roleName != "MEMBER")
            {
                return BadRequest(new
                {
                    message =
                        "Only MEMBER accounts can be approved here."
                });
            }

            string approvalStatus =
                string.IsNullOrWhiteSpace(user.ApprovalStatus)
                    ? "APPROVED"
                    : user.ApprovalStatus.Trim().ToUpper();

            if (approvalStatus != "PENDING")
            {
                return BadRequest(new
                {
                    message =
                        $"This account is already {approvalStatus}."
                });
            }

            if (!user.MemberId.HasValue)
            {
                return BadRequest(new
                {
                    message =
                        "This MEMBER account is not linked to a member."
                });
            }

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.MemberId ==
                        user.MemberId.Value);

            if (member == null)
            {
                return BadRequest(new
                {
                    message =
                        "The linked member record could not be found."
                });
            }

            if (!string.Equals(
                    member.Status?.Trim(),
                    "ACTIVE",
                    StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message =
                        "The linked member is not ACTIVE."
                });
            }

            // =====================================================
            // APPROVE
            // =====================================================

            user.ApprovalStatus = "APPROVED";
            user.IsActive = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER ACCOUNT APPROVED SUCCESSFULLY.",

                userId =
                    user.UserId,

                username =
                    user.Username,

                memberId =
                    user.MemberId,

                approvalStatus =
                    user.ApprovalStatus
            });
        }

        // =========================================================
        // REJECT MEMBER ACCOUNT
        //
        // POST: api/Auth/reject-member/{userId}
        //
        // ADMIN ONLY
        // =========================================================

        [HttpPost("reject-member/{userId:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult>
            RejectMemberAccount(int userId)
        {
            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "USER ACCOUNT NOT FOUND."
                });
            }

            string roleName =
                user.Role?.RoleName?
                    .Trim()
                    .ToUpper() ?? "";

            if (roleName != "MEMBER")
            {
                return BadRequest(new
                {
                    message =
                        "Only MEMBER accounts can be rejected here."
                });
            }

            string approvalStatus =
                string.IsNullOrWhiteSpace(user.ApprovalStatus)
                    ? "APPROVED"
                    : user.ApprovalStatus.Trim().ToUpper();

            if (approvalStatus != "PENDING")
            {
                return BadRequest(new
                {
                    message =
                        $"This account is already {approvalStatus}."
                });
            }

            // =====================================================
            // REJECT
            // =====================================================

            user.ApprovalStatus = "REJECTED";
            user.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "MEMBER ACCOUNT REJECTED.",

                userId =
                    user.UserId,

                username =
                    user.Username,

                memberId =
                    user.MemberId,

                approvalStatus =
                    user.ApprovalStatus
            });
        }

        // =========================================================
        // GET CURRENT USER PERMISSIONS
        //
        // GET: api/Auth/permissions
        //
        // AUTHENTICATED USERS
        // =========================================================

        [HttpGet("permissions")]
        [Authorize]
        public async Task<IActionResult>
            GetCurrentUserPermissions()
        {
            // =====================================================
            // GET USER ID FROM JWT
            // =====================================================

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

            // =====================================================
            // LOAD USER
            // =====================================================

            var user =
                await _context.Users
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

            // =====================================================
            // ACTIVE CHECK
            // =====================================================

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "USER ACCOUNT IS INACTIVE."
                });
            }

            // =====================================================
            // APPROVAL CHECK
            //
            // Existing ADMIN/STAFF accounts with NULL
            // ApprovalStatus are treated as APPROVED.
            // =====================================================

            string approvalStatus =
                string.IsNullOrWhiteSpace(user.ApprovalStatus)
                    ? "APPROVED"
                    : user.ApprovalStatus.Trim().ToUpper();

            if (approvalStatus != "APPROVED")
            {
                return Unauthorized(new
                {
                    message =
                        "USER ACCOUNT IS NOT APPROVED.",

                    approvalStatus =
                        approvalStatus
                });
            }

            // =====================================================
            // ROLE
            // =====================================================

            string roleName =
                user.Role?.RoleName?
                    .Trim() ?? "";

            int? memberId =
                user.MemberId;

            // =====================================================
            // LOAD MEMBER
            // =====================================================

            Member? member = null;

            if (memberId.HasValue)
            {
                member =
                    await _context.Members
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m =>
                            m.MemberId ==
                            memberId.Value);
            }

            // =====================================================
            // MEMBER VALIDATION
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

                        userId =
                            user.UserId,

                        username =
                            user.Username,

                        role =
                            roleName,

                        memberId =
                            (int?)null
                    });
                }

                if (member == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "The MEMBER ID exists, but the member record could not be found.",

                        userId =
                            user.UserId,

                        username =
                            user.Username,

                        role =
                            roleName,

                        memberId =
                            memberId
                    });
                }

                if (!string.Equals(
                        member.Status?.Trim(),
                        "ACTIVE",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Unauthorized(new
                    {
                        message =
                            "The linked member account is inactive.",

                        userId =
                            user.UserId,

                        memberId =
                            memberId
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
                userId =
                    user.UserId,

                username =
                    user.Username,

                fullName =
                    user.FullName,

                roleId =
                    user.RoleId,

                role =
                    roleName,

                memberId =
                    memberId,

                approvalStatus =
                    approvalStatus,

                member =
                    member == null
                        ? null
                        : new
                        {
                            memberId =
                                member.MemberId,

                            memberCode =
                                member.MemberCode,

                            firstName =
                                member.FirstName,

                            middleName =
                                member.MiddleName,

                            lastName =
                                member.LastName,

                            fullName =
                                BuildMemberFullName(
                                    member.FirstName,
                                    member.MiddleName,
                                    member.LastName),

                            status =
                                member.Status,

                            photoPath =
                                member.PhotoPath
                        },

                permissions =
                    permissions
            });
        }

        // =========================================================
        // GET PERMISSIONS FOR ROLE
        // =========================================================

        private async Task<List<PermissionResponse>>
            GetPermissionsForRole(int roleId)
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
            string? key =
                _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException(
                    "JWT Key is not configured.");
            }

            string? issuer =
                _configuration["Jwt:Issuer"];

            string? audience =
                _configuration["Jwt:Audience"];

            int expirationMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpirationMinutes");

            if (expirationMinutes <= 0)
            {
                expirationMinutes = 60;
            }

            string roleName =
                user.Role?.RoleName?.Trim()
                ?? "STAFF";

            var claims =
                new List<Claim>
                {
                    new Claim(
                        ClaimTypes.NameIdentifier,
                        user.UserId.ToString()),

                    new Claim(
                        ClaimTypes.Name,
                        user.Username ?? ""),

                    new Claim(
                        ClaimTypes.GivenName,
                        user.FullName ?? ""),

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

            // =====================================================
            // APPROVAL STATUS CLAIM
            // =====================================================

            string approvalStatus =
                string.IsNullOrWhiteSpace(user.ApprovalStatus)
                    ? "APPROVED"
                    : user.ApprovalStatus.Trim().ToUpper();

            claims.Add(
                new Claim(
                    "ApprovalStatus",
                    approvalStatus));

            // =====================================================
            // SECURITY KEY
            // =====================================================

            var securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key));

            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256);

            // =====================================================
            // TOKEN
            // =====================================================

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

        // =========================================================
        // BUILD MEMBER FULL NAME
        // =========================================================

        private static string BuildMemberFullName(
            string? firstName,
            string? middleName,
            string? lastName)
        {
            return string.Join(
                " ",
                new[]
                {
                    firstName,
                    middleName,
                    lastName
                }
                .Where(x =>
                    !string.IsNullOrWhiteSpace(x))
                .Select(x =>
                    x!.Trim()));
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

        // =========================================================
        // MEMBER VERIFICATION
        // =========================================================

        public string MemberCode { get; set; }
            = string.Empty;

        public string LastName { get; set; }
            = string.Empty;

        // =========================================================
        // OPTIONAL COMPATIBILITY FIELDS
        // =========================================================

        public string Role { get; set; }
            = "MEMBER";

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