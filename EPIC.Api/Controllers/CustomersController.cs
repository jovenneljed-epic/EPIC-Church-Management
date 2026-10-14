using System.Security.Claims;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
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
        private readonly ResendEmailService _emailService;
        private readonly IConfiguration _configuration;

        public CustomersController(
            ApplicationDbContext context,
            IPermissionService permissionService,
            ResendEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _permissionService = permissionService;
            _emailService = emailService;
            _configuration = configuration;
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
            Subscription? subscription = null;

            if (customer.CustomerId == 1)
            {
                // Permanent lifetime access for your church
                isLocked = false;
            }
            else
            {
                subscription = await _context.Subscriptions
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

            // --------------------------------------------------------
            // PERMISSIONS & LIMITS CALCULATION
            // --------------------------------------------------------
            bool isPlatformAdmin = (customer.CustomerId == 1);
            List<string> allowedModules = new();

            if (customer.CustomerId == 1)
            {
                allowedModules = new List<string>
                {
                    "Dashboard",
                    "Church Services",
                    "Event Management",
                    "Reports",
                    "Member Attendance Report",
                    "Members",
                    "Attendance",
                    "SMILE Face Scanner",
                    "Ministries",
                    "Visitors",
                    "Church in Action",
                    "Giving",
                    "Income",
                    "Expenses",
                    "EPIC Learning",
                    "Subscription Dashboard",
                    "Subscriptions",
                    "Demo Requests",
                    "Website Analytics",
                    "Settings",
                    "Blog Management"
                };
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(customer.CustomAllowedModules))
                {
                    allowedModules = customer.CustomAllowedModules
                        .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .ToList();
                }
                else
                {
                    allowedModules.Add("Dashboard");
                    allowedModules.Add("Church Services");
                    allowedModules.Add("Members");
                    allowedModules.Add("Visitors");
                    allowedModules.Add("Settings");

                    if (subscription?.SubscriptionPlan != null)
                    {
                        var plan = subscription.SubscriptionPlan;
                        if (plan.IncludesAttendance)
                        {
                            allowedModules.Add("Attendance");
                            allowedModules.Add("SMILE Face Scanner");
                        }
                        if (plan.IncludesGiving)
                        {
                            allowedModules.Add("Giving");
                        }
                        if (plan.IncludesFinance)
                        {
                            allowedModules.Add("Income");
                            allowedModules.Add("Expenses");
                        }
                        if (plan.IncludesMinistries)
                        {
                            allowedModules.Add("Ministries");
                            allowedModules.Add("Church in Action");
                        }
                        if (plan.IncludesEvents)
                        {
                            allowedModules.Add("Event Management");
                        }
                        if (plan.IncludesEPICLearning)
                        {
                            allowedModules.Add("EPIC Learning");
                        }
                        if (plan.IncludesReports)
                        {
                            allowedModules.Add("Reports");
                            allowedModules.Add("Member Attendance Report");
                        }
                    }
                }
            }

            var maxUsers = customer.MaxUsersOverride ?? (subscription?.SubscriptionPlan?.MaxUsers ?? 5);
            var userCount = await _context.Users.CountAsync(u => u.CustomerId == customer.CustomerId)
                + await _context.ClientMembers.CountAsync(u => u.CustomerId == customer.CustomerId);

            var maxMembers = customer.MaxMembersOverride ?? (subscription?.SubscriptionPlan?.MaxMembers ?? 500);
            var memberCount = await _context.Members.CountAsync(m => m.CustomerId == customer.CustomerId);

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

                isPlatformAdmin = isPlatformAdmin,
                allowedModules = allowedModules,
                maxUsers = maxUsers,
                userCount = userCount,
                maxMembers = maxMembers,
                memberCount = memberCount,

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

            // 5. Send Welcome & First-Time Church Setup Wizard Email
            try
            {
                var plan = await _context.SubscriptionPlans
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.SubscriptionPlanId == subscription.SubscriptionPlanId);
                var planName = plan?.PlanName ?? "EPIC Starter (30-day Free Trial)";

                await _emailService.SendChurchSubscriptionWelcomeAsync(
                    recipientEmail: customer.Email,
                    pastorName: customer.ContactPerson,
                    churchName: customer.ChurchName,
                    customerId: customer.CustomerId,
                    temporaryPassword: request.Password,
                    planName: planName,
                    billingCycle: subscription.BillingCycle,
                    amount: subscription.Amount);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending church welcome email: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                message = "New church tenant provisioned successfully! A confirmation email with the First-Time Setup Wizard link has been sent.",
                customerId = customer.CustomerId,
                churchName = customer.ChurchName,
                adminEmail = customer.Email,
                isSetupCompleted = false
            });
        }

        // =========================================================
        // GET ALL SUBSCRIBERS FOR DEVELOPER MANAGEMENT
        // GET: /api/Customers/subscribers
        // MASTER ADMIN ONLY
        // =========================================================

        [HttpGet("subscribers")]
        public async Task<IActionResult> GetSubscribers()
        {
            var callerCustomerId = await GetCurrentCustomerIdAsync();
            if (callerCustomerId.HasValue && callerCustomerId.Value > 1)
            {
                return Forbid();
            }

            var customers = await _context.Customers
                .AsNoTracking()
                .Where(c => c.CustomerId > 1)
                .OrderBy(c => c.ChurchName)
                .ToListAsync();

            var result = new List<object>();

            foreach (var c in customers)
            {
                var sub = await _context.Subscriptions
                    .Include(s => s.SubscriptionPlan)
                    .OrderByDescending(s => s.CreatedDate)
                    .FirstOrDefaultAsync(s => s.CustomerId == c.CustomerId);

                var userCount = await _context.Users.CountAsync(u => u.CustomerId == c.CustomerId)
                    + await _context.ClientMembers.CountAsync(u => u.CustomerId == c.CustomerId);
                var memberCount = await _context.Members.CountAsync(m => m.CustomerId == c.CustomerId);

                var maxUsers = c.MaxUsersOverride ?? (sub?.SubscriptionPlan?.MaxUsers ?? 5);
                var maxMembers = c.MaxMembersOverride ?? (sub?.SubscriptionPlan?.MaxMembers ?? 500);

                var isLocked = false;
                var now = DateTime.Now;
                var status = sub?.Status ?? "EXPIRED";
                if (status == "EXPIRED" || status == "PAST_DUE" || status == "SUSPENDED" || status == "CANCELLED")
                {
                    isLocked = true;
                }
                else if (sub?.NextBillingDate.HasValue == true && sub.NextBillingDate.Value <= now)
                {
                    isLocked = true;
                }

                result.Add(new
                {
                    customerId = c.CustomerId,
                    churchName = c.ChurchName,
                    contactPerson = c.ContactPerson,
                    email = c.Email,
                    phone = c.Phone,
                    status = c.Status,
                    isSetupCompleted = c.IsSetupCompleted,
                    createdDate = c.CreatedDate,

                    subscriptionId = sub?.SubscriptionId,
                    planName = sub?.SubscriptionPlan?.PlanName ?? "Monthly Subscription",
                    billingCycle = sub?.BillingCycle ?? "Monthly",
                    amount = sub?.Amount ?? (sub?.SubscriptionPlan?.MonthlyPrice ?? 0),
                    nextBillingDate = sub?.NextBillingDate,
                    subscriptionStatus = sub?.Status ?? "NONE",
                    isLocked = isLocked,

                    maxUsers = maxUsers,
                    userCount = userCount,
                    maxMembers = maxMembers,
                    memberCount = memberCount,

                    customAllowedModules = c.CustomAllowedModules
                });
            }

            return Ok(result);
        }

        // =========================================================
        // GET SUBSCRIBER PERMISSIONS (MASTER ADMIN)
        // GET: /api/Customers/{id}/subscriber-permissions
        // =========================================================

        [HttpGet("{id:int}/subscriber-permissions")]
        public async Task<IActionResult> GetSubscriberPermissions(int id)
        {
            var callerCustomerId = await GetCurrentCustomerIdAsync();
            if (callerCustomerId.HasValue && callerCustomerId.Value > 1)
            {
                return Forbid();
            }

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Church subscriber not found." });
            }

            var subscription = await _context.Subscriptions
                .Include(s => s.SubscriptionPlan)
                .OrderByDescending(s => s.CreatedDate)
                .FirstOrDefaultAsync(s => s.CustomerId == id);

            var plan = subscription?.SubscriptionPlan;

            var allAvailableModules = new List<string>
            {
                "Dashboard",
                "Church Services",
                "Members",
                "Attendance",
                "SMILE Face Scanner",
                "Visitors",
                "Giving",
                "Income",
                "Expenses",
                "Ministries",
                "Church in Action",
                "Event Management",
                "EPIC Learning",
                "Reports",
                "Member Attendance Report",
                "Settings"
            };

            var planDefaultModules = new List<string>
            {
                "Dashboard",
                "Church Services",
                "Members",
                "Visitors",
                "Settings"
            };

            if (plan != null)
            {
                if (plan.IncludesAttendance)
                {
                    planDefaultModules.Add("Attendance");
                    planDefaultModules.Add("SMILE Face Scanner");
                }
                if (plan.IncludesGiving) planDefaultModules.Add("Giving");
                if (plan.IncludesFinance)
                {
                    planDefaultModules.Add("Income");
                    planDefaultModules.Add("Expenses");
                }
                if (plan.IncludesMinistries)
                {
                    planDefaultModules.Add("Ministries");
                    planDefaultModules.Add("Church in Action");
                }
                if (plan.IncludesEvents) planDefaultModules.Add("Event Management");
                if (plan.IncludesEPICLearning) planDefaultModules.Add("EPIC Learning");
                if (plan.IncludesReports)
                {
                    planDefaultModules.Add("Reports");
                    planDefaultModules.Add("Member Attendance Report");
                }
            }

            var activeModules = !string.IsNullOrWhiteSpace(customer.CustomAllowedModules)
                ? customer.CustomAllowedModules.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                : planDefaultModules;

            var userCount = await _context.Users.CountAsync(u => u.CustomerId == id)
                + await _context.ClientMembers.CountAsync(u => u.CustomerId == id);
            var memberCount = await _context.Members.CountAsync(m => m.CustomerId == id);

            return Ok(new
            {
                customerId = customer.CustomerId,
                churchName = customer.ChurchName,
                contactPerson = customer.ContactPerson,
                email = customer.Email,
                planName = plan?.PlanName ?? "Custom Plan",
                hasCustomOverride = !string.IsNullOrWhiteSpace(customer.CustomAllowedModules),
                customAllowedModules = customer.CustomAllowedModules,
                allAvailableModules = allAvailableModules,
                planDefaultModules = planDefaultModules,
                activeModules = activeModules,
                maxUsers = customer.MaxUsersOverride ?? (plan?.MaxUsers ?? 5),
                maxUsersOverride = customer.MaxUsersOverride,
                userCount = userCount,
                maxMembers = customer.MaxMembersOverride ?? (plan?.MaxMembers ?? 500),
                maxMembersOverride = customer.MaxMembersOverride,
                memberCount = memberCount
            });
        }

        // =========================================================
        // UPDATE SUBSCRIBER PERMISSIONS (MASTER ADMIN)
        // PUT: /api/Customers/{id}/subscriber-permissions
        // =========================================================

        [HttpPut("{id:int}/subscriber-permissions")]
        public async Task<IActionResult> UpdateSubscriberPermissions(
            int id,
            [FromBody] UpdateSubscriberPermissionsRequest request)
        {
            var callerCustomerId = await GetCurrentCustomerIdAsync();
            if (callerCustomerId.HasValue && callerCustomerId.Value > 1)
            {
                return Forbid();
            }

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Church subscriber not found." });
            }

            if (request.ResetToPlanDefaults == true)
            {
                customer.CustomAllowedModules = null;
            }
            else if (request.AllowedModules != null)
            {
                customer.CustomAllowedModules = string.Join(",", request.AllowedModules);
            }

            if (request.MaxUsersOverride.HasValue)
            {
                customer.MaxUsersOverride = request.MaxUsersOverride.Value > 0 ? request.MaxUsersOverride.Value : null;
            }

            if (request.MaxMembersOverride.HasValue)
            {
                customer.MaxMembersOverride = request.MaxMembersOverride.Value > 0 ? request.MaxMembersOverride.Value : null;
            }

            customer.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Permissions updated successfully for {customer.ChurchName}.",
                customAllowedModules = customer.CustomAllowedModules,
                maxUsersOverride = customer.MaxUsersOverride,
                maxMembersOverride = customer.MaxMembersOverride
            });
        }

        // =========================================================
        // TOGGLE WORKSPACE LOCK (MASTER ADMIN)
        // PUT: /api/Customers/{id}/toggle-lock
        // =========================================================

        [HttpPut("{id:int}/toggle-lock")]
        public async Task<IActionResult> ToggleWorkspaceLock(int id)
        {
            var callerCustomerId = await GetCurrentCustomerIdAsync();
            if (callerCustomerId.HasValue && callerCustomerId.Value > 1)
            {
                return Forbid();
            }

            var subscription = await _context.Subscriptions
                .OrderByDescending(s => s.CreatedDate)
                .FirstOrDefaultAsync(s => s.CustomerId == id);

            if (subscription == null)
            {
                return NotFound(new { message = "No subscription found for this church." });
            }

            if (subscription.Status == "ACTIVE")
            {
                subscription.Status = "SUSPENDED";
            }
            else
            {
                subscription.Status = "ACTIVE";
            }

            subscription.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Workspace status updated to {subscription.Status}.",
                status = subscription.Status
            });
        }
    }

    // =============================================================
    // DTOs
    // =============================================================

    public class UpdateSubscriberPermissionsRequest
    {
        public List<string>? AllowedModules { get; set; }
        public bool? ResetToPlanDefaults { get; set; }
        public int? MaxUsersOverride { get; set; }
        public int? MaxMembersOverride { get; set; }
    }

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