using System.Security.Claims;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Core.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private const string MODULE = "Customers";

        private static readonly string[] AllowedStatuses =
        {
            "Active",
            "Inactive",
            "Suspended",
            "Cancelled"
        };

        private readonly ApplicationDbContext _context;
        private readonly IPermissionService _permissionService;

        public CustomersController(
            ApplicationDbContext context,
            IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // =========================================================
        // GET ALL CUSTOMERS
        // GET: /api/Customers
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetCustomers()
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var customers = await _context.Customers
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .Select(x => new
                {
                    x.CustomerId,
                    x.ChurchName,
                    x.ContactPerson,
                    x.Email,
                    x.Phone,
                    x.Status,
                    x.IsSetupCompleted,
                    x.DemoRequestId,
                    x.CreatedDate,
                    x.UpdatedDate,

                    HasSubscription = _context.Subscriptions
                        .Any(s =>
                            s.ContactEmail == x.Email)
                })
                .ToListAsync();

            return Ok(customers);
        }

        // =========================================================
        // GET CUSTOMER BY ID
        // GET: /api/Customers/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCustomer(int id)
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var customer = await _context.Customers
                .AsNoTracking()
                .Where(x => x.CustomerId == id)
                .Select(x => new
                {
                    x.CustomerId,
                    x.ChurchName,
                    x.ContactPerson,
                    x.Email,
                    x.Phone,
                    x.Status,
                    x.IsSetupCompleted,
                    x.DemoRequestId,
                    x.CreatedDate,
                    x.UpdatedDate,

                    DemoRequest = x.DemoRequest == null
                        ? null
                        : new
                        {
                            x.DemoRequest.DemoRequestId,
                            x.DemoRequest.FullName,
                            x.DemoRequest.ChurchName,
                            x.DemoRequest.Email,
                            x.DemoRequest.Phone,
                            x.DemoRequest.Position,
                            x.DemoRequest.Status,
                            x.DemoRequest.CreatedDate,
                            x.DemoRequest.ContactedDate,
                            x.DemoRequest.DemoDate
                        }
                })
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            return Ok(customer);
        }

        // =========================================================
        // CREATE CUSTOMER
        // POST: /api/Customers
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateCustomer(
            [FromBody] Customer customer)
        {
            if (!await HasPermissionAsync("create"))
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            NormalizeCustomer(customer);

            // =====================================================
            // VALIDATE STATUS
            // =====================================================

            if (!AllowedStatuses.Contains(
                    customer.Status,
                    StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "Invalid customer status.",
                    allowedStatuses = AllowedStatuses
                });
            }

            customer.Status = NormalizeStatus(customer.Status);

            // =====================================================
            // SYSTEM CONTROLLED VALUES
            // =====================================================

            customer.CustomerId = 0;
            customer.CreatedDate = DateTime.UtcNow;
            customer.UpdatedDate = null;

            // =====================================================
            // CHECK DUPLICATE EMAIL
            // =====================================================

            var emailExists = await _context.Customers
                .AnyAsync(x =>
                    x.Email.ToLower() ==
                    customer.Email.ToLower());

            if (emailExists)
            {
                return Conflict(new
                {
                    message =
                        "A customer with this email address already exists."
                });
            }

            // =====================================================
            // VALIDATE DEMO REQUEST
            // =====================================================

            if (customer.DemoRequestId.HasValue)
            {
                var demoRequestExists =
                    await _context.DemoRequests
                        .AnyAsync(x =>
                            x.DemoRequestId ==
                            customer.DemoRequestId.Value);

                if (!demoRequestExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The specified demo request does not exist."
                    });
                }

                var alreadyConverted =
                    await _context.Customers
                        .AnyAsync(x =>
                            x.DemoRequestId ==
                            customer.DemoRequestId.Value);

                if (alreadyConverted)
                {
                    return Conflict(new
                    {
                        message =
                            "This demo request has already been converted to a customer."
                    });
                }
            }

            // =====================================================
            // SAVE
            // =====================================================

            _context.Customers.Add(customer);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Customer created successfully.",

                customer
            });
        }

        // =========================================================
        // UPDATE CUSTOMER
        // PUT: /api/Customers/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateCustomer(
            int id,
            [FromBody] CustomerUpdateDto updatedCustomer)
        {
            if (!await HasPermissionAsync("edit"))
            {
                return Forbid();
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            // =====================================================
            // UPDATE CHURCH NAME
            // =====================================================

            if (updatedCustomer.ChurchName != null)
            {
                var churchName =
                    updatedCustomer.ChurchName.Trim();

                if (string.IsNullOrWhiteSpace(churchName))
                {
                    return BadRequest(new
                    {
                        message =
                            "Church name cannot be empty."
                    });
                }

                customer.ChurchName = churchName;
            }

            // =====================================================
            // UPDATE CONTACT PERSON
            // =====================================================

            if (updatedCustomer.ContactPerson != null)
            {
                var contactPerson =
                    updatedCustomer.ContactPerson.Trim();

                if (string.IsNullOrWhiteSpace(contactPerson))
                {
                    return BadRequest(new
                    {
                        message =
                            "Contact person cannot be empty."
                    });
                }

                customer.ContactPerson = contactPerson;
            }

            // =====================================================
            // UPDATE EMAIL
            // =====================================================

            if (updatedCustomer.Email != null)
            {
                var email =
                    updatedCustomer.Email
                        .Trim()
                        .ToLowerInvariant();

                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new
                    {
                        message =
                            "Email cannot be empty."
                    });
                }

                var emailExists =
                    await _context.Customers
                        .AnyAsync(x =>
                            x.CustomerId != id &&
                            x.Email.ToLower() == email);

                if (emailExists)
                {
                    return Conflict(new
                    {
                        message =
                            "Another customer already uses this email address."
                    });
                }

                customer.Email = email;
            }

            // =====================================================
            // UPDATE PHONE
            // =====================================================

            if (updatedCustomer.Phone != null)
            {
                customer.Phone =
                    string.IsNullOrWhiteSpace(
                        updatedCustomer.Phone)
                        ? null
                        : updatedCustomer.Phone.Trim();
            }

            // =====================================================
            // UPDATE STATUS
            // =====================================================

            if (updatedCustomer.Status != null)
            {
                var status =
                    updatedCustomer.Status.Trim();

                if (!AllowedStatuses.Contains(
                        status,
                        StringComparer.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid customer status.",
                        allowedStatuses =
                            AllowedStatuses
                    });
                }

                customer.Status =
                    NormalizeStatus(status);
            }

            // =====================================================
            // UPDATED DATE
            // =====================================================

            customer.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Customer updated successfully.",

                customer
            });
        }

        // =========================================================
        // DELETE CUSTOMER
        // DELETE: /api/Customers/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCustomer(
            int id)
        {
            if (!await HasPermissionAsync("delete"))
            {
                return Forbid();
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            // =====================================================
            // CHECK ACTIVE SUBSCRIPTIONS
            // =====================================================

            var hasActiveSubscription =
                await _context.Subscriptions
                    .AnyAsync(x =>
                        x.ContactEmail == customer.Email &&
                        (
                            x.Status == "TRIAL" ||
                            x.Status == "ACTIVE" ||
                            x.Status == "PAST_DUE"
                        ));

            if (hasActiveSubscription)
            {
                return Conflict(new
                {
                    message =
                        "This customer cannot be deleted because they have an active subscription."
                });
            }

            _context.Customers.Remove(customer);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Customer deleted successfully."
            });
        }

        // =========================================================
        // GET CUSTOMER SUBSCRIPTIONS
        // GET:
        // /api/Customers/{id}/subscriptions
        // =========================================================

        [HttpGet("{id:int}/subscriptions")]
        public async Task<IActionResult> GetCustomerSubscriptions(
            int id)
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var customer = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == id);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            var subscriptions =
                await _context.Subscriptions
                    .AsNoTracking()
                    .Include(x => x.SubscriptionPlan)
                    .Where(x =>
                        x.ContactEmail == customer.Email)
                    .OrderByDescending(
                        x => x.CreatedDate)
                    .Select(x => new
                    {
                        x.SubscriptionId,
                        x.SubscriptionPlanId,

                        PlanName =
                            x.SubscriptionPlan != null
                                ? x.SubscriptionPlan.PlanName
                                : null,

                        x.ChurchName,
                        x.ContactName,
                        x.ContactEmail,
                        x.ContactPhone,
                        x.BillingCycle,
                        x.Amount,
                        x.Currency,
                        x.Status,
                        x.PaymentCustomerId,
                        x.PaymentSubscriptionId,
                        x.Notes,
                        x.CreatedDate,
                        x.StartDate,
                        x.EndDate
                    })
                    .ToListAsync();

            return Ok(new
            {
                customerId = customer.CustomerId,

                customerName =
                    customer.ChurchName,

                subscriptions
            });
        }

        // =========================================================
        // GET CUSTOMER SUMMARY
        // GET: /api/Customers/summary
        // =========================================================

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            if (!await HasPermissionAsync("view"))
            {
                return Forbid();
            }

            var total =
                await _context.Customers
                    .CountAsync();

            var active =
                await _context.Customers
                    .CountAsync(x =>
                        x.Status == "Active");

            var inactive =
                await _context.Customers
                    .CountAsync(x =>
                        x.Status == "Inactive");

            var suspended =
                await _context.Customers
                    .CountAsync(x =>
                        x.Status == "Suspended");

            var cancelled =
                await _context.Customers
                    .CountAsync(x =>
                        x.Status == "Cancelled");

            return Ok(new
            {
                total,
                active,
                inactive,
                suspended,
                cancelled
            });
        }

        // =========================================================
        // HELPER - CHECK PERMISSION
        // =========================================================

        private async Task<bool> HasPermissionAsync(
            string action)
        {
            return await _permissionService
                .HasPermissionAsync(
                    User,
                    MODULE,
                    action);
        }

        // =========================================================
        // HELPER - NORMALIZE CUSTOMER
        // =========================================================

        private static void NormalizeCustomer(
            Customer customer)
        {
            customer.ChurchName =
                customer.ChurchName?.Trim()
                ?? string.Empty;

            customer.ContactPerson =
                customer.ContactPerson?.Trim()
                ?? string.Empty;

            customer.Email =
                customer.Email?.Trim()
                    .ToLowerInvariant()
                ?? string.Empty;

            customer.Phone =
                string.IsNullOrWhiteSpace(
                    customer.Phone)
                    ? null
                    : customer.Phone.Trim();

            customer.Status =
                string.IsNullOrWhiteSpace(
                    customer.Status)
                    ? "Active"
                    : customer.Status.Trim();
        }

        // =========================================================
        // HELPER - NORMALIZE STATUS
        // =========================================================

        private static string NormalizeStatus(
            string status)
        {
            return status.ToLowerInvariant() switch
            {
                "active" => "Active",
                "inactive" => "Inactive",
                "suspended" => "Suspended",
                "cancelled" => "Cancelled",

                _ => status
            };
        }

        // =========================================================
        // HELPER - CURRENT CUSTOMER ID RESOLUTION
        // =========================================================

        private async Task<int?> GetCurrentCustomerIdAsync()
        {
            var tokenCustId = User.FindFirst("CustomerId")?.Value 
                ?? User.FindFirst("customerId")?.Value;

            if (!string.IsNullOrWhiteSpace(tokenCustId) && int.TryParse(tokenCustId, out var parsed) && parsed > 0)
            {
                return parsed;
            }

            var userIdClaim = User.FindFirst("userId")?.Value 
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out var userId))
            {
                var userCustId = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.UserId == userId)
                    .Select(u => u.CustomerId)
                    .FirstOrDefaultAsync();

                if (userCustId.HasValue && userCustId.Value > 0)
                {
                    return userCustId.Value;
                }
            }

            return null;
        }

        private bool IsAdminUser()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value 
                ?? User.FindFirst("role")?.Value;

            return string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase);
        }

        // =========================================================
        // GET SETUP STATUS
        // GET: /api/Customers/setup-status
        // =========================================================

        [HttpGet("setup-status")]
        public async Task<IActionResult> GetSetupStatus()
        {
            var customerId = await GetCurrentCustomerIdAsync();

            if (!customerId.HasValue || customerId.Value <= 0)
            {
                // Platform admin without a customer scope
                return Ok(new
                {
                    customerId = (int?)null,
                    churchName = "EPIC Platform",
                    isSetupCompleted = true,
                    isPlatformAdmin = true
                });
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.CustomerId == customerId.Value);

            if (customer == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            var hasServices = await _context.ChurchServices
                .AnyAsync(s => s.CustomerId == customerId.Value);

            var hasMembers = await _context.Members
                .AnyAsync(m => m.CustomerId == customerId.Value);

            // Safety guard: If customer already has existing services or members, or is customer 1,
            // they are permanently considered setup completed!
            if (!customer.IsSetupCompleted && (hasServices || hasMembers || customer.CustomerId == 1))
            {
                customer.IsSetupCompleted = true;
                await _context.SaveChangesAsync();
            }

            // --------------------------------------------------------
            // SUBSCRIPTION LOCKOUT CHECK (PERMANENT EXEMPTION FOR CUSTOMER 1)
            // --------------------------------------------------------
            bool isLocked = false;
            string? lockReason = null;
            int? subscriptionId = null;
            string? subscriptionStatus = null;
            DateTime? nextBillingDate = null;
            decimal? subscriptionAmount = null;
            string? planName = null;

            if (customer.CustomerId == 1)
            {
                // Permanent lifetime access for your church
                isLocked = false;
            }
            else
            {
                var subscription = await _context.Subscriptions
                    .Include(s => s.SubscriptionPlan)
                    .OrderByDescending(s => s.CreatedDate)
                    .FirstOrDefaultAsync(s => s.CustomerId == customer.CustomerId);

                if (subscription == null)
                {
                    isLocked = true;
                    lockReason = "No active subscription plan found for this church.";
                }
                else
                {
                    subscriptionId = subscription.SubscriptionId;
                    subscriptionStatus = subscription.Status;
                    nextBillingDate = subscription.NextBillingDate;
                    subscriptionAmount = subscription.Amount;
                    planName = subscription.SubscriptionPlan?.PlanName ?? "Monthly Subscription";

                    var now = DateTime.Now;

                    // Automatically check if trial expired
                    if (string.Equals(subscription.Status, "TRIAL", StringComparison.OrdinalIgnoreCase)
                        && subscription.TrialEndsAt.HasValue
                        && subscription.TrialEndsAt.Value <= now)
                    {
                        subscription.Status = "EXPIRED";
                        subscription.EndDate = now;
                        subscription.UpdatedDate = now;
                        subscriptionStatus = "EXPIRED";
                        await _context.SaveChangesAsync();
                    }
                    // Automatically check if active subscription is past due date
                    else if (string.Equals(subscription.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase)
                        && subscription.NextBillingDate.HasValue
                        && subscription.NextBillingDate.Value <= now)
                    {
                        subscription.Status = "PAST_DUE";
                        subscription.UpdatedDate = now;
                        subscriptionStatus = "PAST_DUE";
                        await _context.SaveChangesAsync();
                    }

                    var statusUpper = (subscriptionStatus ?? "").Trim().ToUpperInvariant();

                    if (statusUpper == "EXPIRED")
                    {
                        isLocked = true;
                        lockReason = "Your church subscription has expired. Please renew your monthly subscription to unlock your workspace.";
                    }
                    else if (statusUpper == "PAST_DUE")
                    {
                        isLocked = true;
                        lockReason = $"Your monthly subscription payment is past due since {subscription.NextBillingDate:MMMM dd, yyyy}. Please submit payment to unlock your workspace.";
                    }
                    else if (statusUpper == "SUSPENDED")
                    {
                        isLocked = true;
                        lockReason = "Your church workspace has been suspended by the administrator.";
                    }
                    else if (statusUpper == "CANCELLED")
                    {
                        isLocked = true;
                        lockReason = "Your church workspace subscription has been cancelled.";
                    }
                }
            }

            return Ok(new
            {
                customerId = customer.CustomerId,
                churchName = customer.ChurchName,
                contactPerson = customer.ContactPerson,
                email = customer.Email,
                phone = customer.Phone,
                isSetupCompleted = customer.IsSetupCompleted,
                hasServices = hasServices,
                hasMembers = hasMembers,

                isLocked = isLocked,
                lockReason = lockReason,
                subscriptionId = subscriptionId,
                subscriptionStatus = subscriptionStatus,
                nextBillingDate = nextBillingDate,
                amount = subscriptionAmount,
                planName = planName
            });
        }

        // =========================================================
        // COMPLETE FIRST-TIME CHURCH SETUP
        // POST: /api/Customers/complete-setup
        // =========================================================

        [HttpPost("complete-setup")]
        public async Task<IActionResult> CompleteSetup(
            [FromBody] CompleteChurchSetupRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Setup data is required." });
            }

            var customerId = await GetCurrentCustomerIdAsync();

            if (!customerId.HasValue || customerId.Value <= 0)
            {
                return BadRequest(new { message = "No valid church tenant associated with your account." });
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.CustomerId == customerId.Value);

            if (customer == null)
            {
                return NotFound(new { message = "Church tenant not found." });
            }

            // 1. Update Customer Profile
            if (!string.IsNullOrWhiteSpace(request.ChurchName))
            {
                customer.ChurchName = request.ChurchName.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.PastorName))
            {
                customer.ContactPerson = request.PastorName.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Phone))
            {
                customer.Phone = request.Phone.Trim();
            }

            customer.IsSetupCompleted = true;
            customer.UpdatedDate = DateTime.Now;

            // 2. Initialize First Church Service if none exists
            var existingService = await _context.ChurchServices
                .AnyAsync(s => s.CustomerId == customer.CustomerId);

            if (!existingService)
            {
                var now = DateTime.Now;
                var daysUntilSunday = ((int)DayOfWeek.Sunday - (int)now.DayOfWeek + 7) % 7;
                if (daysUntilSunday == 0 && now.Hour >= 12)
                {
                    daysUntilSunday = 7;
                }
                var nextSunday = now.Date.AddDays(daysUntilSunday);

                var churchService = new ChurchService
                {
                    CustomerId = customer.CustomerId,
                    ServiceName = string.IsNullOrWhiteSpace(request.ServiceName)
                        ? "Sunday Celebration Service"
                        : request.ServiceName.Trim(),
                    ServiceType = string.IsNullOrWhiteSpace(request.ServiceType)
                        ? "Sunday Worship"
                        : request.ServiceType.Trim(),
                    ServiceDate = nextSunday,
                    StartTime = string.IsNullOrWhiteSpace(request.StartTime)
                        ? "08:00 AM"
                        : request.StartTime.Trim(),
                    EndTime = string.IsNullOrWhiteSpace(request.EndTime)
                        ? "10:00 AM"
                        : request.EndTime.Trim(),
                    Location = string.IsNullOrWhiteSpace(request.Location)
                        ? "Main Sanctuary"
                        : request.Location.Trim(),
                    ServiceLeader = customer.ContactPerson,
                    Speaker = customer.ContactPerson,
                    Description = "Weekly fellowship and worship celebration.",
                    Status = "SCHEDULED",
                    CreatedDate = DateTime.Now
                };

                _context.ChurchServices.Add(churchService);
            }

            // 3. Initialize Default Ministries if selected
            if (request.Ministries != null && request.Ministries.Any())
            {
                foreach (var ministryName in request.Ministries)
                {
                    var trimmed = ministryName.Trim();
                    if (string.IsNullOrWhiteSpace(trimmed)) continue;

                    var minExists = await _context.Ministries
                        .AnyAsync(m => m.CustomerId == customer.CustomerId && m.Name.ToLower() == trimmed.ToLower());

                    if (!minExists)
                    {
                        _context.Ministries.Add(new Ministry
                        {
                            CustomerId = customer.CustomerId,
                            Name = trimmed,
                            MinistryHead = customer.ContactPerson,
                            Description = $"Active ministry team for {trimmed}.",
                            MeetingDay = "Sunday",
                            MeetingTime = "After Service",
                            CreatedDate = DateTime.Now
                        });
                    }
                }
            }

            // 4. Seed default ClientRoles and Permissions for this customer
            await ClientRoleSeeder.SeedForCustomerAsync(_context, customer.CustomerId);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Church workspace successfully initialized!",
                customerId = customer.CustomerId,
                churchName = customer.ChurchName,
                isSetupCompleted = true
            });
        }

        // =========================================================
        // PROVISION NEW CHURCH TENANT
        // POST: /api/Customers/provision
        // Accessible by ADMIN
        // =========================================================

        [HttpPost("provision")]
        public async Task<IActionResult> ProvisionCustomer(
            [FromBody] ProvisionChurchRequest request)
        {
            if (!IsAdminUser() && !await HasPermissionAsync("create"))
            {
                return Forbid();
            }

            if (request == null)
            {
                return BadRequest(new { message = "Provision data is required." });
            }

            if (string.IsNullOrWhiteSpace(request.ChurchName))
            {
                return BadRequest(new { message = "Church Name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.PastorName))
            {
                return BadRequest(new { message = "Pastor / Leader Name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "Admin Email is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters." });
            }

            var emailNormalized = request.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == emailNormalized))
            {
                return BadRequest(new { message = "An account with this email/username already exists." });
            }

            if (await _context.Customers.AnyAsync(c => c.Email.ToLower() == emailNormalized))
            {
                return BadRequest(new { message = "A church with this email already exists." });
            }

            // 1. Create Customer with IsSetupCompleted = false
            var customer = new Customer
            {
                ChurchName = request.ChurchName.Trim(),
                ContactPerson = request.PastorName.Trim(),
                Email = emailNormalized,
                Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                Status = "Active",
                IsSetupCompleted = false,
                CreatedDate = DateTime.Now
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // 2. Create Admin User for this new Customer
            var adminRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "ADMIN")
                ?? await _context.Roles.FirstAsync();

            var user = new User
            {
                Username = emailNormalized,
                FullName = request.PastorName.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim()),
                RoleId = adminRole.RoleId,
                CustomerId = customer.CustomerId,
                ApprovalStatus = "APPROVED",
                CreatedDate = DateTime.Now
            };

            _context.Users.Add(user);

            // 3. Create Starter Subscription (30-day Free Trial)
            var planId = request.SubscriptionPlanId;
            if (!planId.HasValue || planId.Value <= 0)
            {
                var defaultPlan = await _context.SubscriptionPlans
                    .OrderBy(p => p.SortOrder)
                    .FirstOrDefaultAsync();
                planId = defaultPlan?.SubscriptionPlanId ?? 1;
            }

            var subscription = new Subscription
            {
                CustomerId = customer.CustomerId,
                SubscriptionPlanId = planId.Value,
                ChurchName = customer.ChurchName,
                ContactName = customer.ContactPerson,
                ContactEmail = customer.Email,
                ContactPhone = customer.Phone ?? "",
                BillingCycle = "Monthly",
                Amount = 0,
                Currency = "PHP",
                Status = "Trial",
                StartDate = DateTime.Now,
                TrialEndsAt = DateTime.Now.AddDays(30),
                NextBillingDate = DateTime.Now.AddDays(30),
                CreatedDate = DateTime.Now
            };

            _context.Subscriptions.Add(subscription);

            // 4. Seed default ClientRoles
            await ClientRoleSeeder.SeedForCustomerAsync(_context, customer.CustomerId);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "New church tenant provisioned successfully!",
                customerId = customer.CustomerId,
                churchName = customer.ChurchName,
                adminEmail = customer.Email,
                isSetupCompleted = false
            });
        }
    }

    // =============================================================
    // DTOs
    // =============================================================

    public class CompleteChurchSetupRequest
    {
        public string? ChurchName { get; set; }
        public string? PastorName { get; set; }
        public string? Phone { get; set; }
        public string? ServiceName { get; set; }
        public string? ServiceType { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Location { get; set; }
        public List<string>? Ministries { get; set; }
    }

    public class ProvisionChurchRequest
    {
        public string ChurchName { get; set; } = string.Empty;
        public string PastorName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;
        public int? SubscriptionPlanId { get; set; }
    }

    public class CustomerUpdateDto
    {
        public string? ChurchName { get; set; }

        public string? ContactPerson { get; set; }

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public string? Status { get; set; }
    }

    // =============================================================
    // END NAMESPACE
    // =============================================================
}