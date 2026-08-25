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
        // CREATE CLIENT ACCOUNT
        //
        // POST: api/ClientAuth/create-account
        //
        // ADMIN ONLY
        // =========================================================

        [HttpPost("create-account")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> CreateAccount(
            [FromBody] ClientCreateAccountRequest request)
        {
            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // FIND CUSTOMER
            // -----------------------------------------------------

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

            // -----------------------------------------------------
            // CUSTOMER STATUS
            // -----------------------------------------------------

            if (!string.Equals(
                    customer.Status?.Trim(),
                    "Active",
                    StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message =
                        "Customer account is not active."
                });
            }

            // -----------------------------------------------------
            // FIND CLIENT ROLE
            // -----------------------------------------------------

            var role =
                await _context.Roles
                    .FirstOrDefaultAsync(r =>
                        r.RoleName != null &&
                        r.RoleName.ToUpper() == "CLIENT" &&
                        r.IsActive);

            if (role == null)
            {
                return BadRequest(new
                {
                    message =
                        "CLIENT role does not exist or is inactive."
                });
            }

            // -----------------------------------------------------
            // NORMALIZE USERNAME
            // -----------------------------------------------------

            var username =
                request.Username.Trim();

            // -----------------------------------------------------
            // CHECK USERNAME
            // -----------------------------------------------------

            var usernameExists =
                await _context.Users
                    .AnyAsync(u =>
                        u.Username != null &&
                        u.Username.ToLower() ==
                        username.ToLower());

            if (usernameExists)
            {
                return Conflict(new
                {
                    message =
                        "Username already exists."
                });
            }

            // -----------------------------------------------------
            // CHECK CUSTOMER ACCOUNT
            // -----------------------------------------------------

            var existingCustomerAccount =
                await _context.Users
                    .AnyAsync(u =>
                        u.CustomerId ==
                        customer.CustomerId);

            if (existingCustomerAccount)
            {
                return Conflict(new
                {
                    message =
                        "This customer already has a user account."
                });
            }

            // -----------------------------------------------------
            // CREATE USER
            // -----------------------------------------------------

            var user = new User
            {
                Username =
                    username,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        request.Password),

                FullName =
                    customer.ContactPerson,

                RoleId =
                    role.RoleId,

                MemberId =
                    null,

                CustomerId =
                    customer.CustomerId,

                IsActive =
                    true,

                ApprovalStatus =
                    "APPROVED",

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
                    "CLIENT ACCOUNT CREATED SUCCESSFULLY.",

                userId =
                    user.UserId,

                username =
                    user.Username,

                fullName =
                    user.FullName,

                roleId =
                    role.RoleId,

                role =
                    "CLIENT",

                customerId =
                    customer.CustomerId,

                churchName =
                    customer.ChurchName,

                email =
                    customer.Email,

                isActive =
                    user.IsActive,

                approvalStatus =
                    user.ApprovalStatus
            });
        }

        // =========================================================
        // CLIENT LOGIN
        //
        // POST: api/ClientAuth/login
        //
        // PUBLIC
        // =========================================================

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] ClientLoginRequest request)
        {
            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Login data is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.Username))
            {
                return BadRequest(new
                {
                    message =
                        "Email or username is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.Password))
            {
                return BadRequest(new
                {
                    message =
                        "Password is required."
                });
            }

            var login =
                request.Username.Trim();

            // -----------------------------------------------------
            // FIND CLIENT USER
            //
            // LOGIN CAN USE:
            // 1. Username
            // 2. Customer Email
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Customer)
                    .FirstOrDefaultAsync(u =>
                        (
                            u.Username != null &&
                            u.Username.ToLower() ==
                            login.ToLower()
                        )
                        ||
                        (
                            u.Customer != null &&
                            u.Customer.Email != null &&
                            u.Customer.Email.ToLower() ==
                            login.ToLower()
                        ));

            if (user == null)
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID EMAIL/USERNAME OR PASSWORD."
                });
            }

            // -----------------------------------------------------
            // VERIFY CLIENT ROLE
            // -----------------------------------------------------

            var roleName =
                user.Role?.RoleName?
                    .Trim()
                    .ToUpperInvariant();

            if (roleName != "CLIENT")
            {
                return Unauthorized(new
                {
                    message =
                        "THIS ACCOUNT IS NOT A CLIENT ACCOUNT."
                });
            }

            // -----------------------------------------------------
            // VERIFY PASSWORD
            // -----------------------------------------------------

            if (!VerifyPassword(
                    request.Password,
                    user.PasswordHash))
            {
                return Unauthorized(new
                {
                    message =
                        "INVALID EMAIL/USERNAME OR PASSWORD."
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
                        "CLIENT ACCOUNT IS INACTIVE."
                });
            }

            // -----------------------------------------------------
            // APPROVAL CHECK
            // -----------------------------------------------------

            var approvalStatus =
                string.IsNullOrWhiteSpace(
                    user.ApprovalStatus)
                        ? "APPROVED"
                        : user.ApprovalStatus
                            .Trim()
                            .ToUpperInvariant();

            if (approvalStatus != "APPROVED")
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ACCOUNT IS NOT APPROVED.",

                    approvalStatus =
                        approvalStatus
                });
            }

            // -----------------------------------------------------
            // CUSTOMER CHECK
            // -----------------------------------------------------

            if (!user.CustomerId.HasValue)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ACCOUNT IS NOT LINKED TO A CUSTOMER."
                });
            }

            if (user.Customer == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER RECORD COULD NOT BE FOUND."
                });
            }

            // -----------------------------------------------------
            // CUSTOMER STATUS
            // -----------------------------------------------------

            if (!string.Equals(
                    user.Customer.Status?.Trim(),
                    "Active",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ACCOUNT IS NOT ACTIVE."
                });
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
                    "CLIENT LOGIN SUCCESSFUL.",

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
                        "CLIENT",

                    customerId =
                        user.CustomerId,

                    approvalStatus =
                        approvalStatus,

                    isActive =
                        user.IsActive
                },

                client = new
                {
                    clientId =
                        user.Customer.CustomerId,

                    clientName =
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
        // CURRENT CLIENT
        //
        // GET: api/ClientAuth/me
        //
        // CLIENT ONLY
        // =========================================================

        [HttpGet("me")]
        [Authorize(Roles = "CLIENT")]
        public async Task<IActionResult> Me()
        {
            // -----------------------------------------------------
            // GET USER ID FROM JWT
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
            // LOAD USER
            // -----------------------------------------------------

            var user =
                await _context.Users
                    .Include(u => u.Role)
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

            if (user.Role == null ||
                !string.Equals(
                    user.Role.RoleName,
                    "CLIENT",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            // -----------------------------------------------------
            // ACTIVE CHECK
            // -----------------------------------------------------

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ACCOUNT IS INACTIVE."
                });
            }

            // -----------------------------------------------------
            // APPROVAL CHECK
            // -----------------------------------------------------

            var approvalStatus =
                string.IsNullOrWhiteSpace(
                    user.ApprovalStatus)
                        ? "APPROVED"
                        : user.ApprovalStatus
                            .Trim()
                            .ToUpperInvariant();

            if (approvalStatus != "APPROVED")
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT ACCOUNT IS NOT APPROVED.",

                    approvalStatus =
                        approvalStatus
                });
            }

            // -----------------------------------------------------
            // CUSTOMER CHECK
            // -----------------------------------------------------

            if (!user.CustomerId.HasValue ||
                user.Customer == null)
            {
                return Unauthorized(new
                {
                    message =
                        "CLIENT IS NOT LINKED TO A CUSTOMER."
                });
            }

            // -----------------------------------------------------
            // CUSTOMER STATUS
            // -----------------------------------------------------

            if (!string.Equals(
                    user.Customer.Status?.Trim(),
                    "Active",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    message =
                        "CUSTOMER ACCOUNT IS NOT ACTIVE."
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
                    "CLIENT",

                customerId =
                    user.CustomerId,

                approvalStatus =
                    approvalStatus,

                isActive =
                    user.IsActive,

                client = new
                {
                    clientId =
                        user.Customer.CustomerId,

                    clientName =
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
        // JWT
        // =========================================================

        private string GenerateJwtToken(
            User user)
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
                        "CLIENT"),

                    new Claim(
                        "role",
                        "CLIENT"),

                    new Claim(
                        "userId",
                        user.UserId.ToString())
                };

            // -----------------------------------------------------
            // CUSTOMER CLAIM
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
            // APPROVAL STATUS
            // -----------------------------------------------------

            claims.Add(
                new Claim(
                    "approvalStatus",
                    string.IsNullOrWhiteSpace(
                        user.ApprovalStatus)
                        ? "APPROVED"
                        : user.ApprovalStatus
                            .Trim()
                            .ToUpperInvariant()));

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

        public string Username { get; set; }
            = string.Empty;

        public string Password { get; set; }
            = string.Empty;
    }
}