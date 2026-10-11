using BCrypt.Net;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Core.Interfaces;
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
        private readonly IPermissionService _permissionService;

        public UsersController(
            ApplicationDbContext context,
            IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // =========================================================
        // GET ALL USERS (SCOPED BY TENANT / PERMISSIONS)
        // GET: api/users
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] int? customerId = null)
        {
            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            var query = _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .Include(u => u.Customer)
                .AsQueryable();

            if (!isPlatformAdmin)
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1)
                {
                    return Forbid();
                }

                // Client church admin: strictly confined to their own workspace users
                query = query.Where(u => u.CustomerId == callerCustomerId.Value);
            }
            else
            {
                // Platform admin: optional filter by specific church
                if (customerId.HasValue)
                {
                    query = query.Where(u => u.CustomerId == customerId.Value);
                }
            }

            var users = await query
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    fullName = u.FullName,
                    email = u.Email,
                    roleId = u.RoleId,
                    role = u.Role != null ? u.Role.RoleName : null,
                    customerId = u.CustomerId,
                    churchName = u.Customer != null
                        ? u.Customer.ChurchName
                        : (u.CustomerId <= 1 || !u.CustomerId.HasValue ? "Platform Super Admin" : "Unknown Church"),
                    accountType = u.AccountType,
                    approvalStatus = u.ApprovalStatus,
                    isActive = u.IsActive,
                    createdDate = u.CreatedDate,
                    lastLoginDate = u.LastLoginDate
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // GET ORGANIZED USER ACCOUNTS
        // GET: api/users/organized
        // =========================================================

        [HttpGet("organized")]
        public async Task<IActionResult> GetOrganizedUsers()
        {
            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            if (!isPlatformAdmin)
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1)
                {
                    return Forbid();
                }

                // Church Admin: return their church staff and quota info only
                var churchCustomer = await _context.Customers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CustomerId == callerCustomerId.Value);

                if (churchCustomer == null)
                {
                    return NotFound(new { message = "Church workspace not found." });
                }

                var churchSubscription = await _context.Subscriptions
                    .AsNoTracking()
                    .Include(s => s.SubscriptionPlan)
                    .OrderByDescending(s => s.CreatedDate)
                    .FirstOrDefaultAsync(s => s.CustomerId == callerCustomerId.Value);

                var churchPlan = churchSubscription?.SubscriptionPlan;
                int maxUsers = churchCustomer.MaxUsersOverride ?? churchPlan?.MaxUsers ?? 5;

                var churchUsers = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .Where(u => u.CustomerId == callerCustomerId.Value)
                    .OrderBy(u => u.FullName)
                    .Select(u => new
                    {
                        userId = u.UserId,
                        username = u.Username,
                        fullName = u.FullName,
                        email = u.Email,
                        roleId = u.RoleId,
                        role = u.Role != null ? u.Role.RoleName : null,
                        customerId = u.CustomerId,
                        churchName = churchCustomer.ChurchName,
                        accountType = u.AccountType,
                        approvalStatus = u.ApprovalStatus,
                        isActive = u.IsActive,
                        createdDate = u.CreatedDate,
                        lastLoginDate = u.LastLoginDate
                    })
                    .ToListAsync();

                return Ok(new
                {
                    isPlatformAdmin = false,
                    summary = new
                    {
                        totalUsers = churchUsers.Count,
                        platformAdminsCount = 0,
                        churchSubscribersCount = 1,
                        activeUsers = churchUsers.Count(u => u.isActive),
                        inactiveUsers = churchUsers.Count(u => !u.isActive),
                        maxUsers = maxUsers
                    },
                    platformAdmins = Array.Empty<object>(),
                    churchSubscribers = new[]
                    {
                        new
                        {
                            customerId = churchCustomer.CustomerId,
                            churchName = churchCustomer.ChurchName,
                            contactPerson = churchCustomer.ContactPerson,
                            email = churchCustomer.Email,
                            planName = churchPlan?.PlanName ?? "Standard",
                            status = churchSubscription?.Status ?? "ACTIVE",
                            maxUsers = maxUsers,
                            userCount = churchUsers.Count,
                            users = churchUsers
                        }
                    }
                });
            }

            // Platform Developer Super-Admin: full view of all churches and platform accounts
            var allUsers = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .Include(u => u.Customer)
                .OrderBy(u => u.FullName)
                .ToListAsync();

            var platformAdmins = allUsers
                .Where(u => !u.CustomerId.HasValue || u.CustomerId.Value <= 1)
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    fullName = u.FullName,
                    email = u.Email,
                    roleId = u.RoleId,
                    role = u.Role != null ? u.Role.RoleName : "ADMIN",
                    customerId = (int?)1,
                    churchName = "Luke 4:18 Ministries (Platform Owner)",
                    accountType = u.AccountType,
                    approvalStatus = u.ApprovalStatus,
                    isActive = u.IsActive,
                    createdDate = u.CreatedDate,
                    lastLoginDate = u.LastLoginDate
                })
                .ToList();

            var customers = await _context.Customers
                .AsNoTracking()
                .Where(c => c.CustomerId > 1)
                .OrderBy(c => c.ChurchName)
                .ToListAsync();

            var customerIds = customers.Select(c => c.CustomerId).ToList();

            var subscriptions = await _context.Subscriptions
                .AsNoTracking()
                .Include(s => s.SubscriptionPlan)
                .Where(s => customerIds.Contains(s.CustomerId))
                .OrderByDescending(s => s.CreatedDate)
                .ToListAsync();

            var churchSubscribersList = customers.Select(c =>
            {
                var latestSub = subscriptions.FirstOrDefault(s => s.CustomerId == c.CustomerId);
                var plan = latestSub?.SubscriptionPlan;
                int maxUsers = c.MaxUsersOverride ?? plan?.MaxUsers ?? 5;

                var subscriberUsers = allUsers
                    .Where(u => u.CustomerId == c.CustomerId)
                    .Select(u => new
                    {
                        userId = u.UserId,
                        username = u.Username,
                        fullName = u.FullName,
                        email = u.Email,
                        roleId = u.RoleId,
                        role = u.Role != null ? u.Role.RoleName : null,
                        customerId = u.CustomerId,
                        churchName = c.ChurchName,
                        accountType = u.AccountType,
                        approvalStatus = u.ApprovalStatus,
                        isActive = u.IsActive,
                        createdDate = u.CreatedDate,
                        lastLoginDate = u.LastLoginDate
                    })
                    .ToList();

                return new
                {
                    customerId = c.CustomerId,
                    churchName = c.ChurchName,
                    contactPerson = c.ContactPerson,
                    email = c.Email,
                    planName = plan?.PlanName ?? "Standard",
                    status = latestSub?.Status ?? "ACTIVE",
                    maxUsers = maxUsers,
                    userCount = subscriberUsers.Count,
                    users = subscriberUsers
                };
            }).ToList();

            return Ok(new
            {
                isPlatformAdmin = true,
                summary = new
                {
                    totalUsers = allUsers.Count,
                    platformAdminsCount = platformAdmins.Count,
                    churchSubscribersCount = churchSubscribersList.Count,
                    activeUsers = allUsers.Count(u => u.IsActive),
                    inactiveUsers = allUsers.Count(u => !u.IsActive)
                },
                platformAdmins = platformAdmins,
                churchSubscribers = churchSubscribersList
            });
        }

        // =========================================================
        // GET USER BY ID
        // GET: api/users/1
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            var userQuery = _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .Include(u => u.Customer)
                .Where(u => u.UserId == id);

            if (!isPlatformAdmin)
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1)
                {
                    return Forbid();
                }

                userQuery = userQuery.Where(u => u.CustomerId == callerCustomerId.Value);
            }

            var user = await userQuery
                .Select(u => new
                {
                    userId = u.UserId,
                    username = u.Username,
                    fullName = u.FullName,
                    email = u.Email,
                    roleId = u.RoleId,
                    role = u.Role != null ? u.Role.RoleName : null,
                    customerId = u.CustomerId,
                    churchName = u.Customer != null ? u.Customer.ChurchName : "Platform Super Admin",
                    accountType = u.AccountType,
                    approvalStatus = u.ApprovalStatus,
                    isActive = u.IsActive,
                    createdDate = u.CreatedDate,
                    lastLoginDate = u.LastLoginDate
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
        // ADMIN ONLY
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> CreateUser(CreateUserRequest request)
        {
            // -----------------------------------------------------
            // Validate request
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new { message = "Username is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Password is required." });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters." });
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { message = "Full name is required." });
            }

            if (request.RoleId <= 0)
            {
                return BadRequest(new { message = "Role is required." });
            }

            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            int? targetCustomerId;
            if (isPlatformAdmin)
            {
                targetCustomerId = request.CustomerId;
            }
            else
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1)
                {
                    return Forbid();
                }
                targetCustomerId = callerCustomerId.Value;
            }

            // If user is being added to a church subscriber, check seat quota
            if (targetCustomerId.HasValue && targetCustomerId.Value > 1)
            {
                var customer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.CustomerId == targetCustomerId.Value);

                if (customer == null)
                {
                    return BadRequest(new { message = "Church workspace not found." });
                }

                var subscription = await _context.Subscriptions
                    .Include(s => s.SubscriptionPlan)
                    .OrderByDescending(s => s.CreatedDate)
                    .FirstOrDefaultAsync(s => s.CustomerId == targetCustomerId.Value);

                var plan = subscription?.SubscriptionPlan;
                int maxUsers = customer.MaxUsersOverride ?? plan?.MaxUsers ?? 5;
                var currentStaffCount = await _context.Users
                    .CountAsync(u => u.CustomerId == targetCustomerId.Value);

                if (currentStaffCount >= maxUsers)
                {
                    return BadRequest(new
                    {
                        message = $"User seat limit reached for this church ({currentStaffCount}/{maxUsers} seats used). Please upgrade the subscription plan or contact your platform administrator."
                    });
                }
            }

            // -----------------------------------------------------
            // Normalize username & check duplicate
            // -----------------------------------------------------

            var username = request.Username.Trim();

            var usernameExists = await _context.Users
                .AnyAsync(u => u.Username == username);

            if (usernameExists)
            {
                return Conflict(new { message = "Username already exists." });
            }

            // -----------------------------------------------------
            // Validate role
            // -----------------------------------------------------

            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleId == request.RoleId && r.IsActive);

            if (role == null)
            {
                return BadRequest(new { message = "Selected role does not exist or is inactive." });
            }

            // -----------------------------------------------------
            // Create user
            // -----------------------------------------------------

            var user = new User
            {
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName.Trim(),
                Email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : null,
                RoleId = role.RoleId,
                CustomerId = targetCustomerId,
                AccountType = targetCustomerId.HasValue && targetCustomerId.Value > 1 ? "CLIENT" : "SYSTEM",
                IsActive = true,
                ApprovalStatus = "APPROVED",
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
                    email = user.Email,
                    roleId = role.RoleId,
                    role = role.RoleName,
                    customerId = user.CustomerId,
                    accountType = user.AccountType,
                    isActive = user.IsActive,
                    createdDate = user.CreatedDate
                });
        }

        // =========================================================
        // UPDATE USER
        // PUT: api/users/1
        // ADMIN ONLY
        // =========================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
        {
            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Security check: Client church admins cannot touch other churches or platform admins
            if (!isPlatformAdmin)
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1 || user.CustomerId != callerCustomerId.Value)
                {
                    return Forbid();
                }
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { message = "Full name is required." });
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleId == request.RoleId && r.IsActive);

            if (role == null)
            {
                return BadRequest(new { message = "Selected role does not exist or is inactive." });
            }

            user.FullName = request.FullName.Trim();
            user.RoleId = role.RoleId;

            if (request.Email != null)
            {
                user.Email = request.Email.Trim();
            }

            if (request.IsActive.HasValue)
            {
                user.IsActive = request.IsActive.Value;
            }

            user.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "USER UPDATED SUCCESSFULLY.",
                userId = user.UserId,
                username = user.Username,
                fullName = user.FullName,
                email = user.Email,
                roleId = role.RoleId,
                role = role.RoleName,
                isActive = user.IsActive
            });
        }

        // =========================================================
        // CHANGE PASSWORD
        // PUT: api/users/1/password
        // ADMIN ONLY
        // =========================================================

        [HttpPut("{id:int}/password")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ChangePassword(int id, ChangePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "New password is required." });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters." });
            }

            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Security check: Client church admins cannot reset passwords of other churches or platform admins
            if (!isPlatformAdmin)
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1 || user.CustomerId != callerCustomerId.Value)
                {
                    return Forbid();
                }
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordChangedDate = DateTime.Now;
            user.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "PASSWORD UPDATED SUCCESSFULLY.",
                userId = user.UserId,
                username = user.Username
            });
        }

        // =========================================================
        // ACTIVATE / DEACTIVATE USER
        // PUT: api/users/1/status
        // ADMIN ONLY
        // =========================================================

        [HttpPut("{id:int}/status")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateUserStatusRequest request)
        {
            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!isPlatformAdmin)
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1 || user.CustomerId != callerCustomerId.Value)
                {
                    return Forbid();
                }
            }

            var currentUserId = GetCurrentUserId();

            if (currentUserId.HasValue && currentUserId.Value == id && !request.IsActive)
            {
                return BadRequest(new
                {
                    message = "You cannot deactivate your own administrator account."
                });
            }

            user.IsActive = request.IsActive;
            user.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = request.IsActive ? "USER ACTIVATED." : "USER DEACTIVATED.",
                userId = user.UserId,
                isActive = user.IsActive
            });
        }

        // =========================================================
        // DELETE USER
        // DELETE: api/users/1
        // ADMIN ONLY
        // =========================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var isPlatformAdmin = await _permissionService.IsAdminAsync(User);
            var callerCustomerId = await GetCurrentCustomerIdAsync();

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!isPlatformAdmin)
            {
                if (!callerCustomerId.HasValue || callerCustomerId.Value <= 1 || user.CustomerId != callerCustomerId.Value)
                {
                    return Forbid();
                }
            }

            var currentUserId = GetCurrentUserId();

            if (currentUserId.HasValue && currentUserId.Value == id)
            {
                return BadRequest(new
                {
                    message = "You cannot delete your own administrator account."
                });
            }

            // Prevent deleting the last administrator
            if (user.Role != null && user.Role.RoleName.Equals("ADMIN", StringComparison.OrdinalIgnoreCase))
            {
                var adminCount = await _context.Users
                    .Include(u => u.Role)
                    .CountAsync(u =>
                        u.Role != null &&
                        u.Role.RoleName.ToUpper() == "ADMIN" &&
                        u.CustomerId == user.CustomerId);

                if (adminCount <= 1)
                {
                    return BadRequest(new
                    {
                        message = "The last administrator account for this workspace cannot be deleted."
                    });
                }
            }

            _context.Users.Remove(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message = "This user cannot be deleted because the account is associated with other records in the system."
                });
            }

            return Ok(new
            {
                message = "USER DELETED SUCCESSFULLY.",
                userId = user.UserId,
                username = user.Username,
                fullName = user.FullName
            });
        }

        // =========================================================
        // HELPERS
        // =========================================================

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            var subjectClaim = User.FindFirstValue("sub");
            if (int.TryParse(subjectClaim, out userId))
            {
                return userId;
            }

            return null;
        }

        private async Task<int?> GetCurrentCustomerIdAsync()
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                var customerId = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.UserId == userId.Value)
                    .Select(u => u.CustomerId)
                    .FirstOrDefaultAsync();

                if (customerId.HasValue && customerId.Value > 0)
                {
                    return customerId.Value;
                }
            }

            var claim = User.FindFirst("customerId") ?? User.FindFirst("CustomerId") ?? User.FindFirst("tenantId");
            if (claim != null && int.TryParse(claim.Value, out var cid))
            {
                return cid;
            }

            return null;
        }
    }

    // =============================================================
    // REQUEST MODELS
    // =============================================================

    public class CreateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public int RoleId { get; set; }
        public int? CustomerId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public int RoleId { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdateUserStatusRequest
    {
        public bool IsActive { get; set; }
    }
}