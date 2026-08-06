using BCrypt.Net;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL USERS
        // GET: api/users
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    fullName = u.FullName,

                    roleId = u.RoleId,

                    role = u.Role != null
                        ? u.Role.RoleName
                        : null,

                    isActive = u.IsActive,

                    createdDate = u.CreatedDate
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // GET USER BY ID
        // GET: api/users/1
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .Where(u => u.UserId == id)
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    fullName = u.FullName,
                    roleId = u.RoleId,

                    role = u.Role != null
                        ? u.Role.RoleName
                        : null,

                    isActive = u.IsActive,
                    createdDate = u.CreatedDate
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }

        // =========================================================
        // CREATE USER
        // POST: api/users
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateUser(
            CreateUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest("Username is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest("Full name is required.");

            if (request.RoleId <= 0)
                return BadRequest("Role is required.");

            var username = request.Username.Trim();

            var exists = await _context.Users
                .AnyAsync(u => u.Username == username);

            if (exists)
            {
                return Conflict(new
                {
                    message = "Username already exists."
                });
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleId == request.RoleId &&
                    r.IsActive);

            if (role == null)
            {
                return BadRequest(new
                {
                    message = "Selected role does not exist or is inactive."
                });
            }

            var user = new User
            {
                Username = username,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        request.Password),

                FullName = request.FullName.Trim(),

                RoleId = role.RoleId,

                IsActive = true,

                CreatedDate = DateTime.Now
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetUser),
                new { id = user.UserId },
                new
                {
                    userId = user.UserId,
                    username = user.Username,
                    fullName = user.FullName,
                    roleId = role.RoleId,
                    role = role.RoleName,
                    isActive = user.IsActive
                });
        }

        // =========================================================
        // UPDATE USER
        // PUT: api/users/1
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateUser(
            int id,
            UpdateUserRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest("Full name is required.");
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleId == request.RoleId &&
                    r.IsActive);

            if (role == null)
            {
                return BadRequest(new
                {
                    message = "Selected role does not exist or is inactive."
                });
            }

            user.FullName = request.FullName.Trim();

            user.RoleId = request.RoleId;

            if (request.IsActive.HasValue)
            {
                user.IsActive = request.IsActive.Value;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "USER UPDATED SUCCESSFULLY.",

                userId = user.UserId,

                username = user.Username,

                fullName = user.FullName,

                roleId = role.RoleId,

                role = role.RoleName,

                isActive = user.IsActive
            });
        }

        // =========================================================
        // CHANGE PASSWORD
        // PUT: api/users/1/password
        // =========================================================

        [HttpPut("{id:int}/password")]
        public async Task<IActionResult> ChangePassword(
            int id,
            ChangePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest("New password is required.");
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(
                    "Password must be at least 6 characters.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.NewPassword);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "PASSWORD UPDATED SUCCESSFULLY."
            });
        }

        // =========================================================
        // ACTIVATE / DEACTIVATE USER
        // PUT: api/users/1/status
        // =========================================================

        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            UpdateUserStatusRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = request.IsActive
                    ? "USER ACTIVATED."
                    : "USER DEACTIVATED.",

                userId = user.UserId,

                isActive = user.IsActive
            });
        }
    }

    // =============================================================
    // REQUEST MODELS
    // =============================================================

    public class CreateUserRequest
    {
        public string Username { get; set; }
            = string.Empty;

        public string Password { get; set; }
            = string.Empty;

        public string FullName { get; set; }
            = string.Empty;

        public int RoleId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string FullName { get; set; }
            = string.Empty;

        public int RoleId { get; set; }

        public bool? IsActive { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string NewPassword { get; set; }
            = string.Empty;
    }

    public class UpdateUserStatusRequest
    {
        public bool IsActive { get; set; }
    }
}