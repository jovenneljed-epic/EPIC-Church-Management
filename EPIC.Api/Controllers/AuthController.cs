using BCrypt.Net;
using EPIC.Api.Data;
using EPIC.Api.Models;
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
        // POST: api/auth/register
        // =========================================================

        [HttpPost("register")]
        public async Task<IActionResult> Register(
            UserRegisterRequest request)
        {
            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest("Username is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest("Full name is required.");

            // -----------------------------------------------------
            // CHECK USERNAME
            // -----------------------------------------------------

            string username = request.Username.Trim();

            bool usernameExists = await _context.Users
                .AnyAsync(u => u.Username == username);

            if (usernameExists)
                return Conflict("Username already exists.");

            // -----------------------------------------------------
            // DETERMINE ROLE
            // -----------------------------------------------------

            string roleName = string.IsNullOrWhiteSpace(request.Role)
                ? "STAFF"
                : request.Role.Trim().ToUpper();

            // -----------------------------------------------------
            // FIND ROLE
            // -----------------------------------------------------

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleName == roleName &&
                    r.IsActive);

            if (role == null)
            {
                return BadRequest(new
                {
                    message = $"Role '{roleName}' does not exist or is inactive."
                });
            }

            // -----------------------------------------------------
            // HASH PASSWORD
            // -----------------------------------------------------

            string passwordHash =
                BCrypt.Net.BCrypt.HashPassword(request.Password);

            // -----------------------------------------------------
            // CREATE USER
            // -----------------------------------------------------

            var user = new User
            {
                Username = username,

                PasswordHash = passwordHash,

                FullName = request.FullName.Trim(),

                // IMPORTANT:
                // Store RoleId, NOT the Role object
                RoleId = role.RoleId,

                IsActive = true,

                CreatedDate = DateTime.Now
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                message = "USER REGISTERED SUCCESSFULLY.",

                userId = user.UserId,

                username = user.Username,

                fullName = user.FullName,

                roleId = role.RoleId,

                role = role.RoleName
            });
        }


        // =========================================================
        // LOGIN
        // POST: api/auth/login
        // =========================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            UserLoginRequest request)
        {
            // -----------------------------------------------------
            // VALIDATION
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest("Username is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            string username = request.Username.Trim();

            // -----------------------------------------------------
            // FIND USER + LOAD ROLE
            // -----------------------------------------------------

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u =>
                    u.Username == username);

            // -----------------------------------------------------
            // USER NOT FOUND
            // -----------------------------------------------------

            if (user == null)
                return Unauthorized(
                    "INVALID USERNAME OR PASSWORD.");

            // -----------------------------------------------------
            // CHECK ACTIVE
            // -----------------------------------------------------

            if (!user.IsActive)
                return Unauthorized(
                    "THIS ACCOUNT IS INACTIVE.");

            // -----------------------------------------------------
            // CHECK PASSWORD
            // -----------------------------------------------------

            bool passwordValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash);

            if (!passwordValid)
                return Unauthorized(
                    "INVALID USERNAME OR PASSWORD.");

            // -----------------------------------------------------
            // CHECK ROLE
            // -----------------------------------------------------

            if (user.Role == null)
            {
                return Unauthorized(
                    "USER ROLE IS NOT CONFIGURED.");
            }

            // -----------------------------------------------------
            // GENERATE JWT
            // -----------------------------------------------------

            string token = GenerateJwtToken(user);

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                message = "LOGIN SUCCESSFUL.",

                userId = user.UserId,

                username = user.Username,

                fullName = user.FullName,

                roleId = user.RoleId,

                role = user.Role.RoleName,

                token = token
            });
        }

        // =========================================================
        // GET CURRENT USER PERMISSIONS
        // GET: api/auth/permissions
        // =========================================================

        [HttpGet("permissions")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetCurrentUserPermissions()
        {
            // -----------------------------------------------------
            // GET USER ID FROM JWT
            // -----------------------------------------------------

            var userIdClaim =
                User.FindFirst(
                    System.Security.Claims.ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return Unauthorized(new
                {
                    message = "User ID claim is missing."
                });
            }

            if (!int.TryParse(
                    userIdClaim.Value,
                    out int userId))
            {
                return Unauthorized(new
                {
                    message = "Invalid User ID claim."
                });
            }

            // -----------------------------------------------------
            // GET USER + ROLE
            // -----------------------------------------------------

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(
                    u => u.UserId == userId);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "USER NOT FOUND."
                });
            }

            // -----------------------------------------------------
            // GET ROLE PERMISSIONS
            // -----------------------------------------------------

            var permissions =
                await _context.Permissions
                    .AsNoTracking()
                    .Where(p =>
                        p.RoleId == user.RoleId)
                    .Select(p => new
                    {
                        module = p.Module,

                        view = p.CanView,

                        create = p.CanCreate,

                        edit = p.CanEdit,

                        delete = p.CanDelete,

                        export = p.CanExport
                    })
                    .ToListAsync();

            // -----------------------------------------------------
            // RESPONSE
            // -----------------------------------------------------

            return Ok(new
            {
                userId = user.UserId,

                username = user.Username,

                fullName = user.FullName,

                roleId = user.RoleId,

                role = user.Role?.RoleName,

                permissions
            });
        }
        // =========================================================
        // GENERATE JWT TOKEN
        // =========================================================

        private string GenerateJwtToken(User user)
        {
            // -----------------------------------------------------
            // JWT SETTINGS
            // -----------------------------------------------------

            var key = _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException(
                    "JWT Key is not configured.");
            }

            var issuer = _configuration["Jwt:Issuer"];

            var audience = _configuration["Jwt:Audience"];

            var expirationMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpirationMinutes");

            // -----------------------------------------------------
            // ROLE NAME
            // -----------------------------------------------------

            string roleName =
                user.Role?.RoleName ?? "STAFF";

            // -----------------------------------------------------
            // CLAIMS
            // -----------------------------------------------------

            var claims = new List<Claim>
            {
                // User ID
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.UserId.ToString()),

                // Username
                new Claim(
                    ClaimTypes.Name,
                    user.Username),

                // Full Name
                new Claim(
                    ClaimTypes.GivenName,
                    user.FullName),

                // Role
                new Claim(
                    ClaimTypes.Role,
                    roleName)
            };

            // -----------------------------------------------------
            // SECURITY KEY
            // -----------------------------------------------------

            var securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key));

            // -----------------------------------------------------
            // SIGNING CREDENTIALS
            // -----------------------------------------------------

            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256);

            // -----------------------------------------------------
            // CREATE TOKEN
            // -----------------------------------------------------

            var token = new JwtSecurityToken(
                issuer: issuer,

                audience: audience,

                claims: claims,

                expires: DateTime.UtcNow.AddMinutes(
                    expirationMinutes),

                signingCredentials: credentials);

            // -----------------------------------------------------
            // RETURN TOKEN STRING
            // -----------------------------------------------------

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
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