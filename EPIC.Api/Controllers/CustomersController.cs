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
    }

    // =============================================================
    // CUSTOMER UPDATE DTO
    // =============================================================

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