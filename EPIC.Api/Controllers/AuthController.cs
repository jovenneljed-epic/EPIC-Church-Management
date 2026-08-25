
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
        // REGISTER MEMBER
        //
        // POST: api/Auth/register
        //
        // PUBLIC
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
            // VALIDATE REQUEST
            // -----------------------------------------------------

            var validationError = ValidateRegistrationRequest(request);

            if (validationError != null)
            {
                return BadRequest(new
                {
                    message = validationError
                });
            }

            // -----------------------------------------------------
            // NORMALIZE INPUT
            // -----------------------------------------------------

            var username = request.Username.Trim();
            var password = request.Password;
            var fullName = request.FullName.Trim();
            var memberCode = request.MemberCode.Trim();
            var lastName = request.LastName.Trim();

            // -----------------------------------------------------
            // CHECK USERNAME
            // -----------------------------------------------------

            var usernameExists =
                await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u =>
                        u.Username != null &&
                        u.Username.ToLower() == username.ToLower());

            if (usernameExists)
            {
                return Conflict(new
                {
                    message = "Username already exists."
                });
            }

            // -----------------------------------------------------
            // FIND MEMBER
            //
            // MemberCode + LastName are used to verify identity.
            // CustomerId is inherited from the Member record.
            // -----------------------------------------------------

            var member =
                await _context.Members
                    .FirstOrDefaultAsync(m =>
                        m.MemberCode == memberCode &&
                        m.LastName != null &&
                        m.LastName.ToLower() == lastName.ToLower());

            if (member == null)
            {
                return BadRequest(new
                {
                    message =
                        "Member Code and Last Name do not match any registered member."
                });
            }

            // -----------------------------------------------------
            // CUSTOMER VALIDATION
            // -----------------------------------------------------

            if (member.CustomerId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "The selected member is not assigned to a valid church/customer."
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
            // CHECK EXISTING MEMBER ACCOUNT
            // -----------------------------------------------------

            var existingMemberAccount =
                await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u =>
                        u.MemberId == member.MemberId);

            if (existingMemberAccount)
            {
                return Conflict(new
                {
                    message =
                        "This member already has an account or has a pending account approval."
                });
            }

            // -----------------------------------------------------
            // GET MEMBER ROLE
            // -----------------------------------------------------

            var role =
                await _context.Roles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r =>
                        r.RoleName != null &&
                        r.RoleName.ToUpper() == "MEMBER" &&
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
            // HASH PASSWORD
            // -----------------------------------------------------

            var passwordHash =
                BCrypt.Net.BCrypt.HashPassword(password);

            // -----------------------------------------------------
            // CREATE USER
            //
            // IMPORTANT:
            //
            // MEMBER.CustomerId MUST inherit from Member.CustomerId.
            //
            // This is critical for tenant isolation.
            // -----------------------------------------------------

            var user = new User
            {
                Username = username,

                PasswordHash = passwordHash,

                FullName = fullName,

                RoleId = role.RoleId,

                MemberId = member.MemberId,

                CustomerId = member.CustomerId,

                IsActive = false,

                ApprovalStatus = "PENDING",

                CreatedDate = DateTime.Now
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

                status = "PENDING",

                userId = user.UserId,

                username = user.Username,

                fullName = user.FullName,

                roleId = role.RoleId,

                role = NormalizeRole(role.RoleName),

                memberId = member.MemberId,

                customerId = member.CustomerId,

                memberCode = member.MemberCode
            });
        }

        // =========================================================
        // LOGIN
        //
        // POST: api/Auth/login
        //
        // PUBLIC
        //
        // ADMIN
        // STAFF
        // MEMBER
        // CLIENT
        // =========================================================

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] UserLoginRequest request)
        {
            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

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

            var username = request.Username.Trim();

            // -----------------------------------------------------
            // FIND USER
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.Username != null &&
                        u.Username.ToLower() == username.ToLower());

            if (user == null)
            {
                return InvalidCredentials();
            }

            // -----------------------------------------------------
            // VERIFY PASSWORD
            // -----------------------------------------------------

            if (!VerifyPassword(
                    request.Password,
                    user.PasswordHash))
            {
                return InvalidCredentials();
            }

            // -----------------------------------------------------
            // ROLE
            // -----------------------------------------------------

            var roleName =
                NormalizeRole(
                    user.Role?.RoleName);

            if (string.IsNullOrWhiteSpace(roleName))
            {
                return Unauthorized(new
                {
                    message =
                        "USER ROLE IS NOT CONFIGURED."
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

                    status = "PENDING",

                    approvalStatus = "PENDING",

                    userId = user.UserId,

                    username = user.Username,

                    fullName = user.FullName,

                    roleId = user.RoleId,

                    role = roleName,

                    memberId = user.MemberId,

                    customerId = user.CustomerId
                });
            }

            if (approvalStatus == "REJECTED")
            {
                return Unauthorized(new
                {
                    message =
                        "YOUR ACCOUNT REGISTRATION WAS REJECTED BY THE ADMIN.",

                    status = "REJECTED",

                    approvalStatus = "REJECTED",

                    userId = user.UserId,

                    username = user.Username,

                    fullName = user.FullName,

                    roleId = user.RoleId,

                    role = roleName,

                    memberId = user.MemberId,

                    customerId = user.CustomerId
                });
            }

            // -----------------------------------------------------
            // ACTIVE USER CHECK
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
            // LOAD MEMBER
            // -----------------------------------------------------

            Member? member = null;

            if (user.MemberId.HasValue)
            {
                member =
                    await _context.Members
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m =>
                            m.MemberId == user.MemberId.Value);
            }

            // -----------------------------------------------------
            // MEMBER CUSTOMER SYNCHRONIZATION
            //
            // This fixes older MEMBER accounts where:
            //
            // User.CustomerId = NULL
            //
            // but:
            //
            // Member.CustomerId = 1
            //
            // -----------------------------------------------------

            if (roleName == "MEMBER" &&
                member != null &&
                member.CustomerId > 0 &&
                user.CustomerId != member.CustomerId)
            {
                user.CustomerId = member.CustomerId;

                await _context.SaveChangesAsync();
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
            // CLIENT VALIDATION
            // -----------------------------------------------------

            if (roleName == "CLIENT" &&
                !user.CustomerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ACCOUNT IS NOT LINKED TO A CUSTOMER.",

                    userId = user.UserId,

                    customerId = (int?)null
                });
            }

            // -----------------------------------------------------
            // CUSTOMER VALIDATION
            //
            // Every non-system account should have a tenant.
            //
            // ADMIN may also have a CustomerId if this is a
            // church-specific installation.
            // -----------------------------------------------------

            if (!user.CustomerId.HasValue &&
                roleName != "ADMIN")
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ID IS MISSING FROM THIS ACCOUNT.",

                    userId = user.UserId,

                    role = roleName
                });
            }

            // -----------------------------------------------------
            // LOAD PERMISSIONS
            // -----------------------------------------------------

            var permissions =
                await GetPermissionsForRole(
                    user.RoleId);

            // -----------------------------------------------------
            // GENERATE JWT
            // -----------------------------------------------------

            var token =
                GenerateJwtToken(user);

            // -----------------------------------------------------
            // LOGIN RESPONSE
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
                    roleName,

                memberId =
                    user.MemberId,

                customerId =
                    user.CustomerId,

                approvalStatus =
                    approvalStatus,

                member =
                    BuildMemberResponse(member),

                permissions =
                    permissions,

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
        [Authorize]
        public async Task<IActionResult> GetPendingMemberAccounts()
        {
            if (!await IsCurrentUserAdmin())
            {
                return Forbidden(
                    "Only ADMIN users can access pending member accounts.");
            }

            var currentCustomerId =
                await GetCurrentCustomerId();

            var query =
                _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .Include(u => u.Member)
                    .Where(u =>
                        u.ApprovalStatus != null &&
                        u.ApprovalStatus.ToUpper() == "PENDING" &&

                        u.Role != null &&
                        u.Role.RoleName != null &&
                        u.Role.RoleName.ToUpper() == "MEMBER");

            // -----------------------------------------------------
            // TENANT FILTER
            // -----------------------------------------------------

            if (currentCustomerId.HasValue)
            {
                query = query.Where(u =>
                    u.CustomerId == currentCustomerId.Value);
            }

            var pendingUsers =
                await query
                    .OrderBy(u => u.CreatedDate)
                    .Select(u => new
                    {
                        userId = u.UserId,

                        username = u.Username,

                        fullName = u.FullName,

                        memberId = u.MemberId,

                        customerId = u.CustomerId,

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
        // POST: api/Auth/approve-member/{userId}
        //
        // ADMIN ONLY
        // =========================================================

        [HttpPost("approve-member/{userId:int}")]
        [Authorize]
        public async Task<IActionResult> ApproveMemberAccount(
            int userId)
        {
            if (!await IsCurrentUserAdmin())
            {
                return Forbidden(
                    "Only ADMIN users can approve member accounts.");
            }

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Member)
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

            // -----------------------------------------------------
            // TENANT SECURITY
            // -----------------------------------------------------

            if (!await CanAccessCustomer(user.CustomerId))
            {
                return Forbidden(
                    "You cannot approve a member account belonging to another customer.");
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
                        m.MemberId == user.MemberId.Value);

            if (member == null)
            {
                return BadRequest(new
                {
                    message =
                        "The linked member record could not be found."
                });
            }

            if (user.CustomerId != member.CustomerId)
            {
                return BadRequest(new
                {
                    message =
                        "The user account and member belong to different customers."
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

                customerId =
                    user.CustomerId,

                approvalStatus =
                    user.ApprovalStatus,

                isActive =
                    user.IsActive
            });
        }

        // =========================================================
        // REJECT MEMBER
        //
        // POST: api/Auth/reject-member/{userId}
        //
        // ADMIN ONLY
        // =========================================================

        [HttpPost("reject-member/{userId:int}")]
        [Authorize]
        public async Task<IActionResult> RejectMemberAccount(
            int userId)
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

            // -----------------------------------------------------
            // TENANT SECURITY
            // -----------------------------------------------------

            if (!await CanAccessCustomer(user.CustomerId))
            {
                return Forbidden(
                    "You cannot reject a member account belonging to another customer.");
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

                customerId =
                    user.CustomerId,

                approvalStatus =
                    user.ApprovalStatus,

                isActive =
                    user.IsActive
            });
        }

        // =========================================================
        // CURRENT USER PERMISSIONS
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
            // -----------------------------------------------------
            // GET USER ID
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // LOAD USER FROM DATABASE
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.UserId == userId.Value);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message =
                        "USER NOT FOUND."
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
                        "USER ACCOUNT IS INACTIVE."
                });
            }

            // -----------------------------------------------------
            // APPROVAL CHECK
            // -----------------------------------------------------

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
                        approvalStatus
                });
            }

            // -----------------------------------------------------
            // ROLE
            // -----------------------------------------------------

            var roleName =
                NormalizeRole(
                    user.Role?.RoleName);

            if (string.IsNullOrWhiteSpace(roleName))
            {
                return Unauthorized(new
                {
                    message =
                        "USER ROLE IS NOT CONFIGURED."
                });
            }

            // -----------------------------------------------------
            // RESOLVE CUSTOMER ID
            //
            // IMPORTANT:
            //
            // Do NOT rely exclusively on JWT customerId.
            //
            // The database user record is the authoritative
            // tenant association.
            // -----------------------------------------------------

            var customerId =
                user.CustomerId;

            // -----------------------------------------------------
            // MEMBER
            // -----------------------------------------------------

            var memberId =
                user.MemberId;

            Member? member = null;

            if (memberId.HasValue)
            {
                member =
                    await _context.Members
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m =>
                            m.MemberId == memberId.Value);
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

                // -------------------------------------------------
                // VERIFY TENANT
                // -------------------------------------------------

                if (!customerId.HasValue ||
                    customerId.Value != member!.CustomerId)
                {
                    return Unauthorized(new
                    {
                        message =
                            "CUSTOMER ID IS MISSING OR DOES NOT MATCH THE LINKED MEMBER.",

                        userId =
                            user.UserId,

                        memberId =
                            user.MemberId,

                        customerId =
                            customerId
                    });
                }
            }

            // -----------------------------------------------------
            // CLIENT VALIDATION
            // -----------------------------------------------------

            if (roleName == "CLIENT" &&
                !customerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ACCOUNT IS NOT LINKED TO A CUSTOMER."
                });
            }

            // -----------------------------------------------------
            // TENANT CLAIM VALIDATION
            //
            // For all tenant-based users, verify the claim when
            // available, but database remains authoritative.
            // -----------------------------------------------------

            var tokenCustomerId =
                GetCustomerIdFromClaims();

            if (customerId.HasValue &&
                tokenCustomerId.HasValue &&
                customerId.Value != tokenCustomerId.Value)
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ID CLAIM DOES NOT MATCH THE USER ACCOUNT.",

                    userId =
                        user.UserId,

                    customerId =
                        customerId,

                    tokenCustomerId =
                        tokenCustomerId
                });
            }

            // -----------------------------------------------------
            // PERMISSIONS
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

                customerId =
                    customerId,

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
            GetPermissionsForRole(int roleId)
        {
            if (roleId <= 0)
            {
                return new List<PermissionResponse>();
            }

            return await _context.Permissions
                .AsNoTracking()
                .Where(p =>
                    p.RoleId == roleId)
                .OrderBy(p => p.Module)
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
        // GENERATE JWT TOKEN
        // =========================================================

        private string GenerateJwtToken(User user)
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

            if (string.IsNullOrWhiteSpace(issuer))
            {
                throw new InvalidOperationException(
                    "JWT Issuer is not configured.");
            }

            var audience =
                _configuration["Jwt:Audience"];

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
                NormalizeRole(
                    user.Role?.RoleName);

            if (string.IsNullOrWhiteSpace(roleName))
            {
                roleName = "STAFF";
            }

            // -----------------------------------------------------
            // BASIC CLAIMS
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
                        roleName),

                    new Claim(
                        "role",
                        roleName),

                    new Claim(
                        "userId",
                        user.UserId.ToString())
                };

            // -----------------------------------------------------
            // MEMBER CLAIMS
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
            // CUSTOMER CLAIMS
            //
            // IMPORTANT:
            //
            // Both casing variants are intentionally included
            // because different frontend/backend code may read
            // either form.
            // -----------------------------------------------------

            if (user.CustomerId.HasValue &&
                user.CustomerId.Value > 0)
            {
                var customerId =
                    user.CustomerId.Value.ToString();

                claims.Add(
                    new Claim(
                        "CustomerId",
                        customerId));

                claims.Add(
                    new Claim(
                        "customerId",
                        customerId));

                // Useful for generic tenant authorization.
                claims.Add(
                    new Claim(
                        "tenantId",
                        customerId));
            }

            // -----------------------------------------------------
            // APPROVAL STATUS
            // -----------------------------------------------------

            claims.Add(
                new Claim(
                    "approvalStatus",
                    NormalizeApprovalStatus(
                        user.ApprovalStatus)));

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
                    issuer: issuer,

                    audience: audience,

                    claims: claims,

                    notBefore:
                        DateTime.UtcNow,

                    expires:
                        DateTime.UtcNow.AddMinutes(
                            expirationMinutes),

                    signingCredentials:
                        credentials);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        // =========================================================
        // PASSWORD VERIFICATION
        // =========================================================

        private static bool VerifyPassword(
            string password,
            string? passwordHash)
        {
            if (string.IsNullOrWhiteSpace(passwordHash))
            {
                return false;
            }

            try
            {
                return BCrypt.Net.BCrypt.Verify(
                    password,
                    passwordHash);
            }
            catch
            {
                return false;
            }
        }

        // =========================================================
        // GET CURRENT USER ID
        // =========================================================

        private int? GetCurrentUserId()
        {
            var claim =
                User.FindFirst(
                    ClaimTypes.NameIdentifier);

            if (claim == null)
            {
                claim =
                    User.FindFirst("userId");
            }

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
        // GET CUSTOMER ID FROM JWT CLAIMS
        // =========================================================

        private int? GetCustomerIdFromClaims()
        {
            var claim =
                User.FindFirst("customerId");

            if (claim == null)
            {
                claim =
                    User.FindFirst("CustomerId");
            }

            if (claim == null)
            {
                claim =
                    User.FindFirst("tenantId");
            }

            if (claim == null)
            {
                return null;
            }

            return int.TryParse(
                claim.Value,
                out var customerId)
                    ? customerId
                    : null;
        }

        // =========================================================
        // GET CURRENT CUSTOMER ID
        //
        // DATABASE IS AUTHORITATIVE.
        //
        // JWT is used only as fallback.
        // =========================================================

        private async Task<int?> GetCurrentCustomerId()
        {
            var userId =
                GetCurrentUserId();

            if (userId.HasValue)
            {
                var customerId =
                    await _context.Users
                        .AsNoTracking()
                        .Where(u =>
                            u.UserId == userId.Value)
                        .Select(u =>
                            u.CustomerId)
                        .FirstOrDefaultAsync();

                if (customerId.HasValue &&
                    customerId.Value > 0)
                {
                    return customerId.Value;
                }
            }

            return GetCustomerIdFromClaims();
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
        // CHECK CUSTOMER ACCESS
        // =========================================================

        private async Task<bool>
            CanAccessCustomer(int? targetCustomerId)
        {
            if (!targetCustomerId.HasValue ||
                targetCustomerId.Value <= 0)
            {
                return false;
            }

            // -----------------------------------------------------
            // ADMIN
            //
            // Your existing permission service remains the
            // authoritative ADMIN check.
            // -----------------------------------------------------

            if (await IsCurrentUserAdmin())
            {
                var currentCustomerId =
                    await GetCurrentCustomerId();

                // If ADMIN has no tenant restriction,
                // allow access.
                if (!currentCustomerId.HasValue)
                {
                    return true;
                }

                return currentCustomerId.Value ==
                       targetCustomerId.Value;
            }

            // -----------------------------------------------------
            // NORMAL USERS
            // -----------------------------------------------------

            var customerId =
                await GetCurrentCustomerId();

            return customerId.HasValue &&
                   customerId.Value ==
                   targetCustomerId.Value;
        }

        // =========================================================
        // VALIDATE MEMBER ACCOUNT
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

            if (member.CustomerId <= 0)
            {
                return Unauthorized(new
                {
                    message =
                        "The linked member is not assigned to a valid customer.",

                    userId =
                        user.UserId,

                    memberId =
                        user.MemberId
                });
            }

            if (!user.CustomerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ID IS MISSING FROM THE USER ACCOUNT.",

                    userId =
                        user.UserId,

                    memberId =
                        user.MemberId
                });
            }

            if (user.CustomerId.Value !=
                member.CustomerId)
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ID DOES NOT MATCH THE LINKED MEMBER.",

                    userId =
                        user.UserId,

                    userCustomerId =
                        user.CustomerId,

                    memberCustomerId =
                        member.CustomerId
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

                customerId =
                    member.CustomerId,

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
        // REGISTRATION VALIDATION
        // =========================================================

        private static string? ValidateRegistrationRequest(
            UserRegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return "Username is required.";
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return "Password is required.";
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return "Full name is required.";
            }

            if (string.IsNullOrWhiteSpace(request.MemberCode))
            {
                return "Member Code is required.";
            }

            if (string.IsNullOrWhiteSpace(request.LastName))
            {
                return "Last name is required.";
            }

            return null;
        }

        // =========================================================
        // INVALID CREDENTIALS
        // =========================================================

        private IActionResult InvalidCredentials()
        {
            return Unauthorized(new
            {
                message =
                    "INVALID USERNAME OR PASSWORD."
            });
        }

        // =========================================================
        // FORBIDDEN RESPONSE
        // =========================================================

        private static IActionResult Forbidden(
            string message)
        {
            return new ObjectResult(new
            {
                message = message,

                status = "FORBIDDEN"
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

