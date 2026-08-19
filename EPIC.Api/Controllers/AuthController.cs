using BCrypt.Net;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Core.Interfaces;

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
        private readonly IPermissionService _permissionService;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration,
            IPermissionService permissionService)
        {
            _context = context;
            _configuration = configuration;
            _permissionService = permissionService;
        }


        // =========================================================
        // REGISTER
        //
        // POST: api/Auth/register
        //
        // PUBLIC
        //
        // Member registration creates a PENDING account.
        // Admin approval is required before login.
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


            // -----------------------------------------------------
            // VALIDATE INPUT
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // NORMALIZE INPUT
            // -----------------------------------------------------

            var username =
                request.Username.Trim();

            var memberCode =
                request.MemberCode.Trim();

            var lastName =
                request.LastName.Trim();

            var fullName =
                request.FullName.Trim();


            // -----------------------------------------------------
            // USERNAME CHECK
            // -----------------------------------------------------

            var usernameExists =
                await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u =>
                        u.Username != null &&
                        u.Username.ToLower() ==
                        username.ToLower());

            if (usernameExists)
            {
                return Conflict(new
                {
                    message = "Username already exists."
                });
            }


            // -----------------------------------------------------
            // FIND MEMBER
            // -----------------------------------------------------

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.MemberCode == memberCode &&
                        m.LastName != null &&
                        m.LastName.ToLower() ==
                        lastName.ToLower());

            if (member == null)
            {
                return BadRequest(new
                {
                    message =
                        "Member Code and Last Name do not match any registered member."
                });
            }


            // -----------------------------------------------------
            // MEMBER STATUS
            // -----------------------------------------------------

            if (!IsActive(member.Status))
            {
                return BadRequest(new
                {
                    message =
                        "Only ACTIVE members can create an account."
                });
            }


            // -----------------------------------------------------
            // EXISTING MEMBER ACCOUNT
            // -----------------------------------------------------

            var existingMemberAccount =
                await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u =>
                        u.MemberId ==
                        member.MemberId);

            if (existingMemberAccount)
            {
                return Conflict(new
                {
                    message =
                        "This member already has an account or has a pending account approval."
                });
            }


            // -----------------------------------------------------
            // FIND MEMBER ROLE
            // -----------------------------------------------------

            var role =
                await _context.Roles
                    .FirstOrDefaultAsync(r =>
                        r.RoleName != null &&
                        r.RoleName.ToUpper() ==
                        "MEMBER" &&
                        r.IsActive);

            if (role == null)
            {
                return BadRequest(new
                {
                    message =
                        "MEMBER role does not exist or is inactive."
                });
            }


            // -----------------------------------------------------
            // PASSWORD HASH
            // -----------------------------------------------------

            var passwordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password);


            // -----------------------------------------------------
            // CREATE USER
            // -----------------------------------------------------

            var user = new User
            {
                Username =
                    username,

                PasswordHash =
                    passwordHash,

                FullName =
                    fullName,

                RoleId =
                    role.RoleId,

                MemberId =
                    member.MemberId,

                IsActive =
                    false,

                ApprovalStatus =
                    "PENDING",

                CreatedDate =
                    DateTime.Now
            };


            _context.Users.Add(user);

            await _context.SaveChangesAsync();


            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                message =
                    "ACCOUNT CREATED SUCCESSFULLY. YOUR ACCOUNT IS WAITING FOR ADMIN APPROVAL.",

                status =
                    "PENDING",

                userId =
                    user.UserId,

                username =
                    user.Username,

                fullName =
                    user.FullName,

                roleId =
                    role.RoleId,

                role =
                    role.RoleName,

                memberId =
                    member.MemberId,

                memberCode =
                    member.MemberCode
            });
        }


        // =========================================================
        // LOGIN
        //
        // POST: api/Auth/login
        //
        // PUBLIC
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


            var username =
                request.Username.Trim();


            // -----------------------------------------------------
            // FIND USER
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.Username != null &&
                        u.Username.ToLower() ==
                        username.ToLower());

            if (user == null)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID USERNAME OR PASSWORD."
                });
            }


            // -----------------------------------------------------
            // APPROVAL STATUS
            // -----------------------------------------------------

            var approvalStatus =
                NormalizeApprovalStatus(
                    user.ApprovalStatus);


            if (approvalStatus == "PENDING")
            {
                return Unauthorized(new
                {
                    message =
                        "YOUR ACCOUNT IS PENDING ADMIN APPROVAL.",

                    status =
                        "PENDING",

                    userId =
                        user.UserId,

                    username =
                        user.Username
                });
            }


            if (approvalStatus == "REJECTED")
            {
                return Unauthorized(new
                {
                    message =
                        "YOUR ACCOUNT REGISTRATION WAS REJECTED BY THE ADMIN.",

                    status =
                        "REJECTED"
                });
            }


            // -----------------------------------------------------
            // PASSWORD
            // -----------------------------------------------------

            bool passwordValid;

            try
            {
                passwordValid =
                    BCrypt.Net.BCrypt.Verify(
                        request.Password,
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


            // -----------------------------------------------------
            // ACTIVE CHECK
            // -----------------------------------------------------

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "THIS ACCOUNT IS INACTIVE."
                });
            }


            // -----------------------------------------------------
            // ROLE CHECK
            // -----------------------------------------------------

            if (user.Role == null)
            {
                return Unauthorized(new
                {
                    message =
                        "USER ROLE IS NOT CONFIGURED."
                });
            }


            var roleName =
                user.Role.RoleName?
                    .Trim()
                    .ToUpperInvariant() ??
                "";


            // -----------------------------------------------------
            // LOAD MEMBER
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // MEMBER VALIDATION
            // -----------------------------------------------------

            if (roleName == "MEMBER")
            {
                var validation =
                    ValidateMemberAccount(
                        user,
                        member);

                if (validation != null)
                {
                    return validation;
                }
            }


            // -----------------------------------------------------
            // GENERATE JWT
            // -----------------------------------------------------

            var token =
                GenerateJwtToken(user);


            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

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
                    BuildMemberResponse(member),

                token =
                    token
            });
        }


        // =========================================================
        // GET PENDING MEMBER ACCOUNTS
        //
        // GET:
        // api/Auth/pending-members
        //
        // ADMIN ONLY
        // =========================================================

        [HttpGet("pending-members")]
        [Authorize]
        public async Task<IActionResult>
            GetPendingMemberAccounts()
        {
            if (!await IsCurrentUserAdmin())
            {
                return Forbidden(
                    "Only ADMIN users can access pending member accounts.");
            }


            var pendingUsers =
                await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .Include(u => u.Member)
                    .Where(u =>
                        u.ApprovalStatus != null &&
                        u.ApprovalStatus.ToUpper() ==
                        "PENDING" &&

                        u.Role != null &&
                        u.Role.RoleName != null &&
                        u.Role.RoleName.ToUpper() ==
                        "MEMBER")
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

                        isActive =
                            u.IsActive,

                        createdDate =
                            u.CreatedDate
                    })
                    .ToListAsync();


            return Ok(pendingUsers);
        }


        // =========================================================
        // APPROVE MEMBER
        //
        // POST:
        // api/Auth/approve-member/{userId}
        //
        // ADMIN ONLY
        // =========================================================

        [HttpPost("approve-member/{userId:int}")]
        [Authorize]
        public async Task<IActionResult>
            ApproveMemberAccount(int userId)
        {
            if (!await IsCurrentUserAdmin())
            {
                return Forbidden(
                    "Only ADMIN users can approve member accounts.");
            }


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


            var roleName =
                NormalizeRole(
                    user.Role?.RoleName);


            if (roleName != "MEMBER")
            {
                return BadRequest(new
                {
                    message =
                        "Only MEMBER accounts can be approved here."
                });
            }


            var currentStatus =
                NormalizeApprovalStatus(
                    user.ApprovalStatus);


            if (currentStatus != "PENDING")
            {
                return BadRequest(new
                {
                    message =
                        $"This account is already {currentStatus}."
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


            if (!IsActive(member.Status))
            {
                return BadRequest(new
                {
                    message =
                        "The linked member is not ACTIVE."
                });
            }


            // -----------------------------------------------------
            // APPROVE
            // -----------------------------------------------------

            user.ApprovalStatus =
                "APPROVED";

            user.IsActive =
                true;

            
          


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
                    user.ApprovalStatus,

                isActive =
                    user.IsActive
            });
        }


        // =========================================================
        // REJECT MEMBER
        //
        // POST:
        // api/Auth/reject-member/{userId}
        //
        // ADMIN ONLY
        // =========================================================

        [HttpPost("reject-member/{userId:int}")]
        [Authorize]
        public async Task<IActionResult>
            RejectMemberAccount(int userId)
        {
            if (!await IsCurrentUserAdmin())
            {
                return Forbidden(
                    "Only ADMIN users can reject member accounts.");
            }


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


            var roleName =
                NormalizeRole(
                    user.Role?.RoleName);


            if (roleName != "MEMBER")
            {
                return BadRequest(new
                {
                    message =
                        "Only MEMBER accounts can be rejected here."
                });
            }


            var currentStatus =
                NormalizeApprovalStatus(
                    user.ApprovalStatus);


            if (currentStatus != "PENDING")
            {
                return BadRequest(new
                {
                    message =
                        $"This account is already {currentStatus}."
                });
            }


            // -----------------------------------------------------
            // REJECT
            // -----------------------------------------------------

            user.ApprovalStatus =
                "REJECTED";

            user.IsActive =
                false;

            

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
                    user.ApprovalStatus,

                isActive =
                    user.IsActive
            });
        }


        // =========================================================
        // CURRENT USER PERMISSIONS
        //
        // GET:
        // api/Auth/permissions
        //
        // AUTHENTICATED USERS
        // =========================================================

        [HttpGet("permissions")]
        [Authorize]
        public async Task<IActionResult>
            GetCurrentUserPermissions()
        {
            var userId =
                GetCurrentUserId();

            if (!userId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "USER ID CLAIM IS MISSING OR INVALID."
                });
            }


            var user =
                await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.UserId ==
                        userId.Value);

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


            var approvalStatus =
                NormalizeApprovalStatus(
                    user.ApprovalStatus);


            if (approvalStatus != "APPROVED")
            {
                return Unauthorized(new
                {
                    message =
                        "USER ACCOUNT IS NOT APPROVED.",

                    approvalStatus =
                        user.ApprovalStatus
                });
            }


            var roleName =
                NormalizeRole(
                    user.Role?.RoleName);


            var memberId =
                user.MemberId;


            // -----------------------------------------------------
            // LOAD MEMBER
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // MEMBER VALIDATION
            // -----------------------------------------------------

            if (roleName == "MEMBER")
            {
                var validation =
                    ValidateMemberAccount(
                        user,
                        member);

                if (validation != null)
                {
                    return validation;
                }
            }


            // -----------------------------------------------------
            // LOAD PERMISSIONS
            // -----------------------------------------------------

            var permissions =
                await GetPermissionsForRole(
                    user.RoleId);


            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

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
                    BuildMemberResponse(member),

                permissions =
                    permissions
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
                    module =
                        p.Module ?? "",

                    view =
                        p.CanView,

                    create =
                        p.CanCreate,

                    edit =
                        p.CanEdit,

                    delete =
                        p.CanDelete,

                    export =
                        p.CanExport
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


            if (string.IsNullOrWhiteSpace(issuer))
            {
                throw new InvalidOperationException(
                    "JWT Issuer is not configured.");
            }


            if (string.IsNullOrWhiteSpace(audience))
            {
                throw new InvalidOperationException(
                    "JWT Audience is not configured.");
            }


            var expirationMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpirationMinutes");


            if (expirationMinutes <= 0)
            {
                expirationMinutes = 60;
            }


            var roleName =
                string.IsNullOrWhiteSpace(
                    user.Role?.RoleName)
                        ? "STAFF"
                        : user.Role!.RoleName!.Trim();


            // -----------------------------------------------------
            // CLAIMS
            // -----------------------------------------------------

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


            // -----------------------------------------------------
            // MEMBER CLAIM
            //
            // Keep both forms for compatibility with existing
            // frontend/backend code.
            // -----------------------------------------------------

            if (user.MemberId.HasValue)
            {
                var memberId =
                    user.MemberId.Value.ToString();

                claims.Add(
                    new Claim(
                        "MemberId",
                        memberId));

                claims.Add(
                    new Claim(
                        "memberId",
                        memberId));
            }


            // -----------------------------------------------------
            // SECURITY KEY
            // -----------------------------------------------------

            var securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key));


            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256);


            // -----------------------------------------------------
            // TOKEN
            // -----------------------------------------------------

            var token =
                new JwtSecurityToken(
                    issuer:
                        issuer,

                    audience:
                        audience,

                    claims:
                        claims,

                    expires:
                        DateTime.UtcNow.AddMinutes(
                            expirationMinutes),

                    signingCredentials:
                        credentials);


            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }


        // =========================================================
        // CURRENT USER ID
        // =========================================================

        private int? GetCurrentUserId()
        {
            var claim =
                User.FindFirst(
                    ClaimTypes.NameIdentifier);

            if (claim == null)
            {
                return null;
            }


            return int.TryParse(
                claim.Value,
                out var userId)
                    ? userId
                    : null;
        }


        // =========================================================
        // CHECK CURRENT USER ADMIN
        // =========================================================

        private async Task<bool>
            IsCurrentUserAdmin()
        {
            return await _permissionService
                .IsAdminAsync(User);
        }


        // =========================================================
        // MEMBER VALIDATION
        // =========================================================

        private IActionResult? ValidateMemberAccount(
            User user,
            Member? member)
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


            if (!IsActive(member.Status))
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


            return null;
        }


        // =========================================================
        // MEMBER RESPONSE
        // =========================================================

        private static object? BuildMemberResponse(
            Member? member)
        {
            if (member == null)
            {
                return null;
            }


            var fullName =
                string.Join(
                    " ",
                    new[]
                    {
                        member.FirstName,
                        member.MiddleName,
                        member.LastName
                    }
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x)))
                .Trim();


            return new
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
                    fullName,

                status =
                    member.Status,

                photoPath =
                    member.PhotoPath
            };
        }


        // =========================================================
        // ADMIN FORBIDDEN RESPONSE
        // =========================================================

        private static IActionResult Forbidden(
            string message)
        {
            return new ObjectResult(new
            {
                message =
                    message,

                status =
                    "FORBIDDEN"
            })
            {
                StatusCode =
                    StatusCodes.Status403Forbidden
            };
        }


        // =========================================================
        // ACTIVE STATUS
        // =========================================================

        private static bool IsActive(
            string? status)
        {
            return string.Equals(
                status?.Trim(),
                "ACTIVE",
                StringComparison.OrdinalIgnoreCase);
        }


        // =========================================================
        // NORMALIZE ROLE
        // =========================================================

        private static string NormalizeRole(
            string? role)
        {
            return string.IsNullOrWhiteSpace(role)
                ? ""
                : role.Trim().ToUpperInvariant();
        }


        // =========================================================
        // NORMALIZE APPROVAL STATUS
        // =========================================================

        private static string NormalizeApprovalStatus(
            string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return "APPROVED";
            }


            return status
                .Trim()
                .ToUpperInvariant();
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

        public string MemberCode { get; set; }
            = string.Empty;

        public string LastName { get; set; }
            = string.Empty;

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






