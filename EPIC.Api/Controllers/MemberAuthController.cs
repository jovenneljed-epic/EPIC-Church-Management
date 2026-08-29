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
    public class MemberAuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public MemberAuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // =========================================================
        // MEMBER LOGIN
        //
        // POST: api/MemberAuth/login
        //
        // PUBLIC
        //
        // MEMBER ONLY
        //
        // Login can use:
        //
        // 1. Username
        // 2. Email
        // 3. MemberCode
        //
        // =========================================================

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] MemberLoginRequest request)
        {
            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            if (request == null)
            {
                return BadRequest(new
                {
                    message = "LOGIN DATA IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new
                {
                    message =
                        "USERNAME, EMAIL, OR MEMBER CODE IS REQUIRED."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "PASSWORD IS REQUIRED."
                });
            }

            // -----------------------------------------------------
            // NORMALIZE LOGIN
            // -----------------------------------------------------

            var login =
                request.Username.Trim();

            var normalizedLogin =
                login.ToUpperInvariant();

            // -----------------------------------------------------
            // FIND MEMBER ACCOUNT
            //
            // IMPORTANT:
            //
            // We explicitly require:
            //
            // Role = MEMBER
            // AccountType = MEMBER
            // MemberId != null
            // CustomerId != null
            //
            // This prevents CLIENT / ADMIN / STAFF accounts
            // from entering the MEMBER portal.
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Member)
                    .Include(u => u.Customer)
                    .FirstOrDefaultAsync(u =>
                        u.Role != null &&
                        u.Role.RoleName != null &&

                        u.Role.RoleName
                            .Trim()
                            .ToUpper() == "MEMBER"

                        &&

                        u.AccountType != null &&

                        u.AccountType
                            .Trim()
                            .ToUpper() == "MEMBER"

                        &&

                        u.MemberId.HasValue

                        &&

                        u.CustomerId.HasValue

                        &&

                        (
                            // USERNAME
                            (
                                u.Username != null &&
                                u.Username
                                    .Trim()
                                    .ToUpper() ==
                                    normalizedLogin
                            )

                            ||

                            // EMAIL
                            (
                                u.Email != null &&
                                u.Email
                                    .Trim()
                                    .ToUpper() ==
                                    normalizedLogin
                            )

                            ||

                            // MEMBER CODE
                            (
                                u.Member != null &&
                                u.Member.MemberCode != null &&
                                u.Member.MemberCode
                                    .Trim()
                                    .ToUpper() ==
                                    normalizedLogin
                            )
                        )
                    );

            // -----------------------------------------------------
            // ACCOUNT NOT FOUND
            // -----------------------------------------------------

            if (user == null)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID MEMBER USERNAME, EMAIL, MEMBER CODE, OR PASSWORD."
                });
            }

            // -----------------------------------------------------
            // ROLE SECURITY CHECK
            // -----------------------------------------------------

            var roleName =
                user.Role?.RoleName?
                    .Trim()
                    .ToUpperInvariant();

            if (roleName != "MEMBER")
            {
                return Unauthorized(new
                {
                    message =
                        "ONLY MEMBER ACCOUNTS MAY ACCESS THE MEMBER PORTAL."
                });
            }

            // -----------------------------------------------------
            // ACCOUNT TYPE SECURITY CHECK
            // -----------------------------------------------------

            var accountType =
                user.AccountType?
                    .Trim()
                    .ToUpperInvariant();

            if (accountType != "MEMBER")
            {
                return Unauthorized(new
                {
                    message =
                        "ONLY MEMBER ACCOUNTS MAY ACCESS THE MEMBER PORTAL."
                });
            }

            // -----------------------------------------------------
            // MEMBER LINK CHECK
            // -----------------------------------------------------

            if (!user.MemberId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS NOT LINKED TO A MEMBER."
                });
            }

            // -----------------------------------------------------
            // CUSTOMER LINK CHECK
            // -----------------------------------------------------

            if (!user.CustomerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS NOT LINKED TO A CUSTOMER."
                });
            }

            // -----------------------------------------------------
            // MEMBER RECORD CHECK
            // -----------------------------------------------------

            if (user.Member == null)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER RECORD COULD NOT BE FOUND."
                });
            }

            // -----------------------------------------------------
            // CUSTOMER RECORD CHECK
            // -----------------------------------------------------

            if (user.Customer == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER RECORD COULD NOT BE FOUND."
                });
            }

            // -----------------------------------------------------
            // PASSWORD CHECK
            // -----------------------------------------------------

            if (!VerifyPassword(
                    request.Password,
                    user.PasswordHash))
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID MEMBER USERNAME, EMAIL, MEMBER CODE, OR PASSWORD."
                });
            }

            // -----------------------------------------------------
            // USER ACTIVE CHECK
            // -----------------------------------------------------

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS INACTIVE."
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
                        "MEMBER ACCOUNT IS NOT APPROVED.",

                    approvalStatus =
                        approvalStatus
                });
            }

            // -----------------------------------------------------
            // MEMBER STATUS CHECK
            // -----------------------------------------------------

            if (!IsActiveStatus(user.Member.Status))
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS INACTIVE.",

                    memberStatus =
                        user.Member.Status
                });
            }

            // -----------------------------------------------------
            // CUSTOMER STATUS CHECK
            // -----------------------------------------------------

            if (!IsActiveStatus(user.Customer.Status))
            {
                return Unauthorized(new
                {
                    message =
                        "CHURCH CUSTOMER ACCOUNT IS NOT ACTIVE.",

                    customerStatus =
                        user.Customer.Status
                });
            }

            // -----------------------------------------------------
            // UPDATE LAST LOGIN
            // -----------------------------------------------------

            user.LastLoginDate =
                DateTime.Now;

            user.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

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
                    "MEMBER LOGIN SUCCESSFUL.",

                token =
                    token,

                accessToken =
                    token,

                user = new
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
                        "MEMBER",

                    accountType =
                        "MEMBER",

                    memberId =
                        user.MemberId,

                    customerId =
                        user.CustomerId,

                    approvalStatus =
                        approvalStatus,

                    isActive =
                        user.IsActive
                },

                member = new
                {
                    memberId =
                        user.Member.MemberId,

                    memberCode =
                        user.Member.MemberCode,

                    firstName =
                        user.Member.FirstName,

                    middleName =
                        user.Member.MiddleName,

                    lastName =
                        user.Member.LastName,

                    fullName =
                        BuildFullName(
                            user.Member.FirstName,
                            user.Member.MiddleName,
                            user.Member.LastName),

                    gender =
                        user.Member.Gender,

                    birthDate =
                        user.Member.BirthDate,

                    contactNumber =
                        user.Member.ContactNumber,

                    address =
                        user.Member.Address,

                    civilStatus =
                        user.Member.CivilStatus,

                    ministry =
                        user.Member.Ministry,

                    dateJoined =
                        user.Member.DateJoined,

                    status =
                        user.Member.Status,

                    photoPath =
                        user.Member.PhotoPath,

                    customerId =
                        user.Member.CustomerId
                },

                customer = new
                {
                    customerId =
                        user.Customer.CustomerId,

                    churchName =
                        user.Customer.ChurchName,

                    contactPerson =
                        user.Customer.ContactPerson,

                    email =
                        user.Customer.Email,

                    phone =
                        user.Customer.Phone,

                    status =
                        user.Customer.Status
                }
            });
        }

        // =========================================================
        // CURRENT MEMBER
        //
        // GET: api/MemberAuth/me
        //
        // MEMBER ONLY
        // =========================================================

        [HttpGet("me")]
        [Authorize(Roles = "MEMBER")]
        public async Task<IActionResult> Me()
        {
            // -----------------------------------------------------
            // GET USER ID
            // -----------------------------------------------------

            var userIdClaim =
                User.FindFirst(
                    ClaimTypes.NameIdentifier);

            if (userIdClaim == null ||
                !int.TryParse(
                    userIdClaim.Value,
                    out var userId))
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID USER TOKEN."
                });
            }

            // -----------------------------------------------------
            // LOAD MEMBER ACCOUNT
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Member)
                    .Include(u => u.Customer)
                    .AsNoTracking()
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

            // -----------------------------------------------------
            // ROLE CHECK
            // -----------------------------------------------------

            var roleName =
                user.Role?.RoleName?
                    .Trim()
                    .ToUpperInvariant();

            if (roleName != "MEMBER")
            {
                return Forbid();
            }

            // -----------------------------------------------------
            // ACCOUNT TYPE CHECK
            // -----------------------------------------------------

            var accountType =
                user.AccountType?
                    .Trim()
                    .ToUpperInvariant();

            if (accountType != "MEMBER")
            {
                return Forbid();
            }

            // -----------------------------------------------------
            // ACTIVE USER CHECK
            // -----------------------------------------------------

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS INACTIVE."
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
                        "MEMBER ACCOUNT IS NOT APPROVED.",

                    approvalStatus =
                        approvalStatus
                });
            }

            // -----------------------------------------------------
            // MEMBER LINK
            // -----------------------------------------------------

            if (!user.MemberId.HasValue ||
                user.Member == null)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS NOT LINKED TO A MEMBER."
                });
            }

            // -----------------------------------------------------
            // CUSTOMER LINK
            // -----------------------------------------------------

            if (!user.CustomerId.HasValue ||
                user.Customer == null)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS NOT LINKED TO A CUSTOMER."
                });
            }

            // -----------------------------------------------------
            // MEMBER STATUS
            // -----------------------------------------------------

            if (!IsActiveStatus(
                    user.Member.Status))
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS INACTIVE.",

                    memberStatus =
                        user.Member.Status
                });
            }

            // -----------------------------------------------------
            // CUSTOMER STATUS
            // -----------------------------------------------------

            if (!IsActiveStatus(
                    user.Customer.Status))
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ACCOUNT IS NOT ACTIVE.",

                    customerStatus =
                        user.Customer.Status
                });
            }

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
                    "MEMBER",

                accountType =
                    "MEMBER",

                memberId =
                    user.MemberId,

                customerId =
                    user.CustomerId,

                approvalStatus =
                    approvalStatus,

                isActive =
                    user.IsActive,

                member = new
                {
                    memberId =
                        user.Member.MemberId,

                    memberCode =
                        user.Member.MemberCode,

                    firstName =
                        user.Member.FirstName,

                    middleName =
                        user.Member.MiddleName,

                    lastName =
                        user.Member.LastName,

                    fullName =
                        BuildFullName(
                            user.Member.FirstName,
                            user.Member.MiddleName,
                            user.Member.LastName),

                    gender =
                        user.Member.Gender,

                    birthDate =
                        user.Member.BirthDate,

                    contactNumber =
                        user.Member.ContactNumber,

                    address =
                        user.Member.Address,

                    civilStatus =
                        user.Member.CivilStatus,

                    ministry =
                        user.Member.Ministry,

                    dateJoined =
                        user.Member.DateJoined,

                    status =
                        user.Member.Status,

                    photoPath =
                        user.Member.PhotoPath,

                    customerId =
                        user.Member.CustomerId
                },

                customer = new
                {
                    customerId =
                        user.Customer.CustomerId,

                    churchName =
                        user.Customer.ChurchName,

                    contactPerson =
                        user.Customer.ContactPerson,

                    email =
                        user.Customer.Email,

                    phone =
                        user.Customer.Phone,

                    status =
                        user.Customer.Status
                }
            });
        }

        // =========================================================
        // VERIFY PASSWORD
        // =========================================================

        private static bool VerifyPassword(
            string password,
            string? passwordHash)
        {
            if (string.IsNullOrWhiteSpace(
                    passwordHash))
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
        // NORMALIZE APPROVAL STATUS
        // =========================================================

        private static string NormalizeApprovalStatus(
            string? approvalStatus)
        {
            if (string.IsNullOrWhiteSpace(
                    approvalStatus))
            {
                return "APPROVED";
            }

            return approvalStatus
                .Trim()
                .ToUpperInvariant();
        }

        // =========================================================
        // ACTIVE STATUS
        // =========================================================

        private static bool IsActiveStatus(
            string? status)
        {
            return string.Equals(
                status?.Trim(),
                "ACTIVE",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // BUILD FULL NAME
        // =========================================================

        private static string BuildFullName(
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
                    !string.IsNullOrWhiteSpace(x)))
                .Trim();
        }

        // =========================================================
        // GENERATE MEMBER JWT
        // =========================================================

        private string GenerateJwtToken(
            User user)
        {
            // -----------------------------------------------------
            // JWT CONFIGURATION
            // -----------------------------------------------------

            var key =
                _configuration["Jwt:Key"];

            var issuer =
                _configuration["Jwt:Issuer"];

            var audience =
                _configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException(
                    "JWT Key is not configured.");
            }

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

            // -----------------------------------------------------
            // EXPIRATION
            // -----------------------------------------------------

            var expirationMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpirationMinutes");

            if (expirationMinutes <= 0)
            {
                expirationMinutes = 60;
            }

            // -----------------------------------------------------
            // APPROVAL
            // -----------------------------------------------------

            var approvalStatus =
                NormalizeApprovalStatus(
                    user.ApprovalStatus);

            // -----------------------------------------------------
            // CLAIMS
            // -----------------------------------------------------

            var claims =
                new List<Claim>
                {
                    // USER ID
                    new Claim(
                        ClaimTypes.NameIdentifier,
                        user.UserId.ToString()),

                    new Claim(
                        "userId",
                        user.UserId.ToString()),

                    // USERNAME
                    new Claim(
                        ClaimTypes.Name,
                        user.Username ?? string.Empty),

                    // FULL NAME
                    new Claim(
                        ClaimTypes.GivenName,
                        user.FullName ?? string.Empty),

                    // ROLE
                    new Claim(
                        ClaimTypes.Role,
                        "MEMBER"),

                    // COMPATIBILITY ROLE
                    new Claim(
                        "role",
                        "MEMBER"),

                    // ACCOUNT TYPE
                    new Claim(
                        "accountType",
                        "MEMBER")
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
            // -----------------------------------------------------

            if (user.CustomerId.HasValue)
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
            }

            // -----------------------------------------------------
            // APPROVAL CLAIM
            // -----------------------------------------------------

            claims.Add(
                new Claim(
                    "approvalStatus",
                    approvalStatus));

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

            // -----------------------------------------------------
            // RETURN
            // -----------------------------------------------------

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }

    // =============================================================
    // MEMBER LOGIN REQUEST
    // =============================================================

    public class MemberLoginRequest
    {
        public string Username { get; set; }
            = string.Empty;

        public string Password { get; set; }
            = string.Empty;
    }
}