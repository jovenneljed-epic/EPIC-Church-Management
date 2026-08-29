
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
    public class ClientAuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public ClientAuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // =========================================================
        // CREATE CLIENT MEMBER ACCOUNT
        // POST: api/ClientAuth/create-account
        // =========================================================

        [HttpPost("create-account")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> CreateAccount(
            [FromBody] ClientCreateAccountRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Account data is required."
                });
            }

            if (request.CustomerId <= 0)
            {
                return BadRequest(new
                {
                    message = "CustomerId is required."
                });
            }

            if (request.MemberId <= 0)
            {
                return BadRequest(new
                {
                    message = "MemberId is required."
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

            if (request.Password.Length < 6)
            {
                return BadRequest(new
                {
                    message = "Password must be at least 6 characters."
                });
            }

            // =====================================================
            // NORMALIZE
            // =====================================================

            var username = request.Username.Trim();

            var normalizedUsername =
                username.ToUpperInvariant();

            // =====================================================
            // CUSTOMER
            // =====================================================

            var customer =
                await _context.Customers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c =>
                        c.CustomerId == request.CustomerId);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            if (!IsActiveCustomerStatus(customer.Status))
            {
                return BadRequest(new
                {
                    message = "Customer account is not active."
                });
            }

            // =====================================================
            // MEMBER
            // =====================================================

            var member =
                await _context.Members
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m =>
                        m.MemberId == request.MemberId &&
                        m.CustomerId == request.CustomerId);

            if (member == null)
            {
                return NotFound(new
                {
                    message =
                        "Member not found or member does not belong to this customer."
                });
            }

            if (!IsActiveMemberStatus(member.Status))
            {
                return BadRequest(new
                {
                    message = "Member account is not active."
                });
            }

            // =====================================================
            // USERNAME
            // =====================================================

            var usernameExists =
                await _context.ClientMembers
                    .AnyAsync(cm =>
                        cm.Username != null &&
                        cm.Username.Trim().ToUpper() ==
                        normalizedUsername);

            if (usernameExists)
            {
                return Conflict(new
                {
                    message = "Username already exists."
                });
            }

            // =====================================================
            // ONE CLIENT ACCOUNT PER MEMBER
            // =====================================================

            var existingMemberAccount =
                await _context.ClientMembers
                    .AnyAsync(cm =>
                        cm.CustomerId == request.CustomerId &&
                        cm.MemberId == request.MemberId);

            if (existingMemberAccount)
            {
                return Conflict(new
                {
                    message =
                        "This member already has a client account."
                });
            }

            // =====================================================
            // CLIENT ROLE
            // =====================================================

            ClientRole? clientRole;

            if (request.ClientRoleId.HasValue)
            {
                clientRole =
                    await _context.ClientRoles
                        .FirstOrDefaultAsync(r =>
                            r.ClientRoleId ==
                                request.ClientRoleId.Value &&
                            r.CustomerId ==
                                request.CustomerId &&
                            r.IsActive);
            }
            else
            {
                clientRole =
                    await _context.ClientRoles
                        .FirstOrDefaultAsync(r =>
                            r.CustomerId ==
                                request.CustomerId &&
                            r.RoleName != null &&
                            r.RoleName.Trim().ToUpper() ==
                                "CLIENT_MEMBER" &&
                            r.IsActive);
            }

            if (clientRole == null)
            {
                return BadRequest(new
                {
                    message =
                        request.ClientRoleId.HasValue
                            ? "The selected client role does not exist, is inactive, or does not belong to this customer."
                            : "Default CLIENT_MEMBER role was not found for this customer."
                });
            }

            // =====================================================
            // CREATE ACCOUNT
            // =====================================================

            var clientMember =
                new ClientMember
                {
                    CustomerId = customer.CustomerId,
                    MemberId = member.MemberId,
                    ClientRoleId = clientRole.ClientRoleId,

                    Username = username,

                    PasswordHash =
                        BCrypt.Net.BCrypt.HashPassword(
                            request.Password),

                    Status = "ACTIVE",
                    IsActive = true,

                    CreatedDate = DateTime.UtcNow,
                    LastLoginDate = null,

                    Email = null,
                    ContactNumber = member.ContactNumber
                };

            _context.ClientMembers.Add(clientMember);

            await _context.SaveChangesAsync();

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "CLIENT MEMBER ACCOUNT CREATED SUCCESSFULLY.",

                clientMemberId =
                    clientMember.ClientMemberId,

                customerId =
                    clientMember.CustomerId,

                churchName =
                    customer.ChurchName,

                memberId =
                    clientMember.MemberId,

                memberCode =
                    member.MemberCode,

                memberName =
                    GetMemberFullName(member),

                clientRoleId =
                    clientMember.ClientRoleId,

                clientRoleName =
                    clientRole.RoleName,

                username =
                    clientMember.Username,

                email =
                    clientMember.Email,

                contactNumber =
                    clientMember.ContactNumber,

                status =
                    clientMember.Status,

                isActive =
                    clientMember.IsActive,

                createdDate =
                    clientMember.CreatedDate
            });
        }

        // =========================================================
        // CLIENT LOGIN
        // POST: api/ClientAuth/login
        // =========================================================

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] ClientLoginRequest request)
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
                    message = "Username or email is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            var login =
                request.Username.Trim();

            // =====================================================
            // LOAD CLIENT ACCOUNT
            // =====================================================

            var clientMember =
                await _context.ClientMembers
                    .Include(cm => cm.Customer)
                    .Include(cm => cm.Member)
                    .Include(cm => cm.ClientRole)
                    .FirstOrDefaultAsync(cm =>
                        cm.Username == login ||
                        cm.Email == login);

            if (clientMember == null)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT USERNAME/EMAIL OR PASSWORD."
                });
            }

            // =====================================================
            // PASSWORD
            // =====================================================

            if (!VerifyPassword(
                    request.Password,
                    clientMember.PasswordHash))
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT USERNAME/EMAIL OR PASSWORD."
                });
            }

            // =====================================================
            // CLIENT MEMBER VALIDATION
            // =====================================================

            if (!clientMember.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT MEMBER ACCOUNT IS INACTIVE."
                });
            }

            if (!IsActiveClientMemberStatus(
                    clientMember.Status))
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT MEMBER ACCOUNT IS NOT ACTIVE."
                });
            }

            // =====================================================
            // CUSTOMER
            // =====================================================

            if (clientMember.Customer == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER RECORD COULD NOT BE FOUND."
                });
            }

            if (!IsActiveCustomerStatus(
                    clientMember.Customer.Status))
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ACCOUNT IS NOT ACTIVE."
                });
            }

            // =====================================================
            // MEMBER
            // =====================================================

            if (clientMember.Member == null)
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER RECORD COULD NOT BE FOUND."
                });
            }

            if (!IsActiveMemberStatus(
                    clientMember.Member.Status))
            {
                return Unauthorized(new
                {
                    message =
                        "MEMBER ACCOUNT IS NOT ACTIVE."
                });
            }

            // =====================================================
            // CLIENT ROLE
            // =====================================================

            if (clientMember.ClientRole == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ROLE RECORD COULD NOT BE FOUND."
                });
            }

            if (!clientMember.ClientRole.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ROLE IS INACTIVE."
                });
            }

            // =====================================================
            // UPDATE LOGIN
            // =====================================================

            clientMember.LastLoginDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // =====================================================
            // GENERATE TOKEN
            // =====================================================

            var token =
                GenerateJwtToken(clientMember);

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                message =
                    "CLIENT MEMBER LOGIN SUCCESSFUL.",

                token = token,
                accessToken = token,

                user = BuildUserResponse(clientMember),

                client = BuildClientResponse(clientMember),

                member = BuildMemberResponse(clientMember),

                clientRole =
                    BuildClientRoleResponse(clientMember)
            });
        }

        // =========================================================
        // CURRENT CLIENT MEMBER
        // GET: api/ClientAuth/me
        // =========================================================

        [HttpGet("me")]
        [Authorize(Roles = "CLIENT")]
        public async Task<IActionResult> Me()
        {
            // =====================================================
            // RESOLVE CLIENT MEMBER ID
            // =====================================================

            var clientMemberId =
                GetIntClaim(
                    "clientMemberId",
                    ClaimTypes.NameIdentifier);

            if (!clientMemberId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID CLIENT MEMBER TOKEN."
                });
            }

            // =====================================================
            // LOAD ACCOUNT
            // =====================================================

            var clientMember =
                await _context.ClientMembers
                    .Include(cm => cm.Customer)
                    .Include(cm => cm.Member)
                    .Include(cm => cm.ClientRole)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(cm =>
                        cm.ClientMemberId ==
                        clientMemberId.Value);

            if (clientMember == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT MEMBER ACCOUNT NOT FOUND."
                });
            }

            // =====================================================
            // VALIDATE ACCOUNT
            // =====================================================

            var validationError =
                ValidateClientMember(clientMember);

            if (validationError != null)
            {
                return Unauthorized(new
                {
                    message = validationError
                });
            }

            // =====================================================
            // RESPONSE
            // =====================================================

            return Ok(new
            {
                clientMemberId =
                    clientMember.ClientMemberId,

                username =
                    clientMember.Username,

                role =
                    "CLIENT",

                accountType =
                    "CLIENT",

                clientRoleId =
                    clientMember.ClientRoleId,

                clientRoleName =
                    clientMember.ClientRole!.RoleName,

                customerId =
                    clientMember.CustomerId,

                memberId =
                    clientMember.MemberId,

                memberCode =
                    clientMember.Member!.MemberCode,

                email =
                    clientMember.Email,

                contactNumber =
                    clientMember.ContactNumber,

                status =
                    clientMember.Status,

                isActive =
                    clientMember.IsActive,

                createdDate =
                    clientMember.CreatedDate,

                lastLoginDate =
                    clientMember.LastLoginDate,

                client =
                    BuildClientResponse(clientMember),

                member =
                    BuildMemberResponse(clientMember),

                clientRole =
                    BuildClientRoleResponse(clientMember)
            });
        }

        // =========================================================
        // BUILD USER RESPONSE
        // =========================================================

        private static object BuildUserResponse(
            ClientMember clientMember)
        {
            return new
            {
                clientMemberId =
                    clientMember.ClientMemberId,

                username =
                    clientMember.Username,

                fullName =
                    GetMemberFullName(
                        clientMember.Member),

                role =
                    "CLIENT",

                accountType =
                    "CLIENT",

                clientRoleId =
                    clientMember.ClientRoleId,

                clientRoleName =
                    clientMember.ClientRole!.RoleName,

                customerId =
                    clientMember.CustomerId,

                memberId =
                    clientMember.MemberId,

                memberCode =
                    clientMember.Member!.MemberCode,

                email =
                    clientMember.Email,

                contactNumber =
                    clientMember.ContactNumber,

                status =
                    clientMember.Status,

                isActive =
                    clientMember.IsActive
            };
        }

        // =========================================================
        // BUILD CLIENT RESPONSE
        // =========================================================

        private static object BuildClientResponse(
            ClientMember clientMember)
        {
            return new
            {
                clientId =
                    clientMember.Customer!.CustomerId,

                clientName =
                    clientMember.Customer.ChurchName,

                contactPerson =
                    clientMember.Customer.ContactPerson,

                email =
                    clientMember.Customer.Email,

                phone =
                    clientMember.Customer.Phone,

                status =
                    clientMember.Customer.Status
            };
        }

        // =========================================================
        // BUILD MEMBER RESPONSE
        // =========================================================

        private static object BuildMemberResponse(
            ClientMember clientMember)
        {
            var member =
                clientMember.Member!;

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
                    GetMemberFullName(member),

                customerId =
                    member.CustomerId,

                status =
                    member.Status
            };
        }

        // =========================================================
        // BUILD CLIENT ROLE RESPONSE
        // =========================================================

        private static object BuildClientRoleResponse(
            ClientMember clientMember)
        {
            var role =
                clientMember.ClientRole!;

            return new
            {
                clientRoleId =
                    role.ClientRoleId,

                roleName =
                    role.RoleName,

                description =
                    role.Description,

                isSystemRole =
                    role.IsSystemRole,

                isActive =
                    role.IsActive
            };
        }

        // =========================================================
        // VALIDATE CLIENT MEMBER
        // =========================================================

        private static string? ValidateClientMember(
            ClientMember clientMember)
        {
            if (!clientMember.IsActive)
            {
                return
                    "CLIENT MEMBER ACCOUNT IS INACTIVE.";
            }

            if (!IsActiveClientMemberStatus(
                    clientMember.Status))
            {
                return
                    "CLIENT MEMBER ACCOUNT IS NOT ACTIVE.";
            }

            if (clientMember.Customer == null)
            {
                return
                    "CUSTOMER RECORD COULD NOT BE FOUND.";
            }

            if (!IsActiveCustomerStatus(
                    clientMember.Customer.Status))
            {
                return
                    "CUSTOMER ACCOUNT IS NOT ACTIVE.";
            }

            if (clientMember.Member == null)
            {
                return
                    "MEMBER RECORD COULD NOT BE FOUND.";
            }

            if (!IsActiveMemberStatus(
                    clientMember.Member.Status))
            {
                return
                    "MEMBER ACCOUNT IS NOT ACTIVE.";
            }

            if (clientMember.ClientRole == null)
            {
                return
                    "CLIENT ROLE RECORD COULD NOT BE FOUND.";
            }

            if (!clientMember.ClientRole.IsActive)
            {
                return
                    "CLIENT ROLE IS INACTIVE.";
            }

            return null;
        }

        // =========================================================
        // GET INTEGER CLAIM
        // =========================================================

        private int? GetIntClaim(
            params string[] claimTypes)
        {
            foreach (var claimType in claimTypes)
            {
                var claim =
                    User.FindFirst(claimType);

                if (claim != null &&
                    int.TryParse(
                        claim.Value,
                        out var value))
                {
                    return value;
                }
            }

            return null;
        }

        // =========================================================
        // VERIFY PASSWORD
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
        // CUSTOMER STATUS
        // =========================================================

        private static bool IsActiveCustomerStatus(
            string? status)
        {
            return string.Equals(
                status?.Trim(),
                "ACTIVE",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // MEMBER STATUS
        // =========================================================

        private static bool IsActiveMemberStatus(
            string? status)
        {
            return string.Equals(
                status?.Trim(),
                "ACTIVE",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // CLIENT MEMBER STATUS
        // =========================================================

        private static bool IsActiveClientMemberStatus(
            string? status)
        {
            return string.Equals(
                status?.Trim(),
                "ACTIVE",
                StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // MEMBER FULL NAME
        // =========================================================

        private static string GetMemberFullName(
            Member? member)
        {
            if (member == null)
            {
                return string.Empty;
            }

            var parts =
                new[]
                {
                    member.FirstName,
                    member.MiddleName,
                    member.LastName
                }
                .Where(x =>
                    !string.IsNullOrWhiteSpace(x) &&
                    !string.Equals(
                        x.Trim(),
                        "N/A",
                        StringComparison.OrdinalIgnoreCase))
                .Select(x => x!.Trim());

            return string.Join(" ", parts);
        }

        // =========================================================
        // GENERATE JWT
        // =========================================================

        private string GenerateJwtToken(
            ClientMember clientMember)
        {
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

            var expirationMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpirationMinutes");

            if (expirationMinutes <= 0)
            {
                expirationMinutes = 60;
            }

            // =====================================================
            // IMPORTANT:
            // These claims are deliberately duplicated using
            // consistent names because the EPIC permission system
            // uses clientMemberId, customerId and memberId.
            // =====================================================

            var claims =
                new List<Claim>
                {
                    // -------------------------------------------------
                    // CLIENT MEMBER ID
                    // -------------------------------------------------

                    new Claim(
                        "clientMemberId",
                        clientMember.ClientMemberId.ToString()),

                    new Claim(
                        ClaimTypes.NameIdentifier,
                        clientMember.ClientMemberId.ToString()),

                    // -------------------------------------------------
                    // USER ID
                    // -------------------------------------------------

                    new Claim(
                        "userId",
                        clientMember.ClientMemberId.ToString()),

                    // -------------------------------------------------
                    // USERNAME
                    // -------------------------------------------------

                    new Claim(
                        ClaimTypes.Name,
                        clientMember.Username ?? string.Empty),

                    // -------------------------------------------------
                    // FULL NAME
                    // -------------------------------------------------

                    new Claim(
                        ClaimTypes.GivenName,
                        GetMemberFullName(
                            clientMember.Member)),

                    // -------------------------------------------------
                    // APPLICATION ROLE
                    // -------------------------------------------------

                    new Claim(
                        ClaimTypes.Role,
                        "CLIENT"),

                    new Claim(
                        "role",
                        "CLIENT"),

                    new Claim(
                        "accountType",
                        "CLIENT"),

                    // -------------------------------------------------
                    // CUSTOMER / TENANT
                    // -------------------------------------------------

                    new Claim(
                        "customerId",
                        clientMember.CustomerId.ToString()),

                    new Claim(
                        "CustomerId",
                        clientMember.CustomerId.ToString()),

                    new Claim(
                        "tenantId",
                        clientMember.CustomerId.ToString()),

                    // -------------------------------------------------
                    // MEMBER
                    // -------------------------------------------------

                    new Claim(
                        "memberId",
                        clientMember.MemberId.ToString()),

                    new Claim(
                        "MemberId",
                        clientMember.MemberId.ToString()),

                    // -------------------------------------------------
                    // CLIENT ROLE
                    // -------------------------------------------------

                    new Claim(
                        "clientRoleId",
                        clientMember.ClientRoleId.ToString())
                };

            // =====================================================
            // CLIENT ROLE NAME
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                    clientMember.ClientRole?.RoleName))
            {
                claims.Add(
                    new Claim(
                        "clientRoleName",
                        clientMember.ClientRole!.RoleName.Trim()));
            }

            // =====================================================
            // MEMBER CODE
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                    clientMember.Member?.MemberCode))
            {
                claims.Add(
                    new Claim(
                        "memberCode",
                        clientMember.Member!.MemberCode.Trim()));
            }

            // =====================================================
            // APPROVAL STATUS
            // =====================================================

            claims.Add(
                new Claim(
                    "approvalStatus",
                    "APPROVED"));

            // =====================================================
            // SECURITY
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
    }

    // =============================================================
    // CLIENT LOGIN REQUEST
    // =============================================================

    public class ClientLoginRequest
    {
        public string Username { get; set; }
            = string.Empty;

        public string Password { get; set; }
            = string.Empty;
    }

    // =============================================================
    // CLIENT CREATE ACCOUNT REQUEST
    // =============================================================

    public class ClientCreateAccountRequest
    {
        public int CustomerId { get; set; }

        public int MemberId { get; set; }

        public string Username { get; set; }
            = string.Empty;

        public string Password { get; set; }
            = string.Empty;

        public int? ClientRoleId { get; set; }
    }
}

