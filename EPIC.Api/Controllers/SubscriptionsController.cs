using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly string[] AllowedStatuses =
        {
            "TRIAL",
            "ACTIVE",
            "PAST_DUE",
            "SUSPENDED",
            "EXPIRED",
            "CANCELLED"
        };

        private static readonly string[] BlockingStatuses =
        {
            "TRIAL",
            "ACTIVE",
            "PAST_DUE",
            "SUSPENDED"
        };

        private static readonly string[] RenewableStatuses =
        {
            "CANCELLED",
            "EXPIRED",
            "PAST_DUE",
            "SUSPENDED"
        };

        public SubscriptionsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL
        // GET: api/Subscriptions
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetSubscriptions()
        {
            var subscriptions = await _context.Subscriptions
                .AsNoTracking()
                .Select(ToResponse())
                .OrderByDescending(s => s.CreatedDate)
                .ToListAsync();

            return Ok(subscriptions);
        }

        // =========================================================
        // GET BY ID
        // GET: api/Subscriptions/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetSubscription(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid subscription ID."
                });
            }

            var subscription = await _context.Subscriptions
                .AsNoTracking()
                .Where(s =>
                    s.SubscriptionId == id)
                .Select(ToResponse())
                .FirstOrDefaultAsync();

            if (subscription == null)
            {
                return NotFound(new
                {
                    message = "Subscription not found."
                });
            }

            return Ok(subscription);
        }

        // =========================================================
        // CREATE
        // POST: api/Subscriptions
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateSubscription(
            [FromBody] CreateSubscriptionDto request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Subscription data is required."
                });
            }

            if (request.CustomerId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid customer is required."
                });
            }

            if (request.SubscriptionPlanId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "A valid subscription plan is required."
                });
            }

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c =>
                    c.CustomerId == request.CustomerId);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            var plan = await _context.SubscriptionPlans
                .FirstOrDefaultAsync(p =>
                    p.SubscriptionPlanId ==
                    request.SubscriptionPlanId &&
                    p.IsActive);

            if (plan == null)
            {
                return BadRequest(new
                {
                    message =
                        "The selected subscription plan is not available."
                });
            }

            var billingCycle =
                NormalizeBillingCycle(
                    request.BillingCycle);

            if (billingCycle == null)
            {
                return BadRequest(new
                {
                    message =
                        "Billing cycle must be either Monthly or Annual."
                });
            }

            // =====================================================
            // CHECK EXISTING ACTIVE/PENDING SUBSCRIPTION
            // =====================================================

            var hasExistingSubscription =
                await _context.Subscriptions.AnyAsync(s =>
                    s.CustomerId == customer.CustomerId &&
                    BlockingStatuses.Contains(s.Status));

            if (hasExistingSubscription)
            {
                return Conflict(new
                {
                    message =
                        "This customer already has an active or pending subscription."
                });
            }

            var now = DateTime.UtcNow;

            var hasTrial =
                plan.TrialDays > 0;

            DateTime? trialEndsAt =
                hasTrial
                    ? now.AddDays(plan.TrialDays)
                    : null;

            DateTime? nextBillingDate =
                hasTrial
                    ? trialEndsAt
                    : CalculateNextBillingDate(
                        now,
                        billingCycle);

            var amount =
                billingCycle.Equals(
                    "Annual",
                    StringComparison.OrdinalIgnoreCase)
                    ? plan.AnnualPrice
                    : plan.MonthlyPrice;

            var subscription = new Subscription
            {
                CustomerId =
                    customer.CustomerId,

                ChurchName =
                    customer.ChurchName,

                ContactName =
                    customer.ContactPerson,

                ContactEmail =
                    customer.Email,

                ContactPhone =
                    customer.Phone ?? string.Empty,

                SubscriptionPlanId =
                    plan.SubscriptionPlanId,

                BillingCycle =
                    billingCycle,

                Amount =
                    amount,

                Currency =
                    "PHP",

                Status =
                    hasTrial
                        ? "TRIAL"
                        : "ACTIVE",

                StartDate =
                    now,

                TrialEndsAt =
                    trialEndsAt,

                NextBillingDate =
                    nextBillingDate,

                EndDate =
                    null,

                CancelledDate =
                    null,

                Notes =
                    string.IsNullOrWhiteSpace(request.Notes)
                        ? null
                        : request.Notes.Trim(),

                CreatedDate =
                    now,

                UpdatedDate =
                    null
            };

            _context.Subscriptions.Add(subscription);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetSubscription),
                new
                {
                    id = subscription.SubscriptionId
                },
                new
                {
                    success = true,
                    message =
                        "Subscription created successfully.",

                    subscription =
                        ToResponseDto(
                            subscription,
                            plan.PlanName)
                });
        }

        // =========================================================
        // UPDATE
        // PUT: api/Subscriptions/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateSubscription(
            int id,
            [FromBody] UpdateSubscriptionDto request)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid subscription ID."
                });
            }

            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Subscription data is required."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId == id);

            if (subscription == null)
            {
                return NotFound(new
                {
                    message =
                        "Subscription not found."
                });
            }

            // =====================================================
            // CUSTOMER
            // =====================================================

            if (request.CustomerId.HasValue)
            {
                if (request.CustomerId.Value <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid customer ID."
                    });
                }

                var customer =
                    await _context.Customers
                        .FirstOrDefaultAsync(c =>
                            c.CustomerId ==
                            request.CustomerId.Value);

                if (customer == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Customer not found."
                    });
                }

                subscription.CustomerId =
                    customer.CustomerId;

                subscription.ChurchName =
                    customer.ChurchName;

                subscription.ContactName =
                    customer.ContactPerson;

                subscription.ContactEmail =
                    customer.Email;

                subscription.ContactPhone =
                    customer.Phone ?? string.Empty;
            }

            // =====================================================
            // PLAN
            // =====================================================

            if (request.SubscriptionPlanId.HasValue)
            {
                if (request.SubscriptionPlanId.Value <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid subscription plan."
                    });
                }

                var plan =
                    await _context.SubscriptionPlans
                        .FirstOrDefaultAsync(p =>
                            p.SubscriptionPlanId ==
                            request.SubscriptionPlanId.Value &&
                            p.IsActive);

                if (plan == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "The selected subscription plan is not available."
                    });

                }

                subscription.SubscriptionPlanId =
                    plan.SubscriptionPlanId;
            }

            // =====================================================
            // BILLING CYCLE
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                request.BillingCycle))
            {
                var billingCycle =
                    NormalizeBillingCycle(
                        request.BillingCycle);

                if (billingCycle == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Billing cycle must be either Monthly or Annual."
                    });
                }

                subscription.BillingCycle =
                    billingCycle;
            }

            // =====================================================
            // STATUS
            // =====================================================

            if (!string.IsNullOrWhiteSpace(
                request.Status))
            {
                var status =
                    request.Status
                        .Trim()
                        .ToUpperInvariant();

                if (!AllowedStatuses.Contains(status))
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid subscription status."
                    });
                }

                var previousStatus =
                    subscription.Status
                        .Trim()
                        .ToUpperInvariant();

                subscription.Status =
                    status;

                // -------------------------------------------------
                // CANCEL
                // -------------------------------------------------

                if (status == "CANCELLED" &&
                    previousStatus != "CANCELLED")
                {
                    var now = DateTime.UtcNow;

                    subscription.CancelledDate =
                        now;

                    subscription.EndDate =
                        now;
                }

                // -------------------------------------------------
                // RESTORE
                // -------------------------------------------------

                if (status != "CANCELLED" &&
                    previousStatus == "CANCELLED")
                {
                    subscription.CancelledDate =
                        null;

                    subscription.EndDate =
                        null;
                }
            }

            // =====================================================
            // NOTES
            // =====================================================

            if (request.Notes != null)
            {
                subscription.Notes =
                    string.IsNullOrWhiteSpace(
                        request.Notes)
                        ? null
                        : request.Notes.Trim();
            }

            // =====================================================
            // CURRENT PLAN
            // =====================================================

            var currentPlan =
                await _context.SubscriptionPlans
                    .FirstOrDefaultAsync(p =>
                        p.SubscriptionPlanId ==
                        subscription.SubscriptionPlanId &&
                        p.IsActive);

            if (currentPlan == null)
            {
                return BadRequest(new
                {
                    message =
                        "Subscription plan not found or inactive."
                });
            }

            // =====================================================
            // UPDATE PRICE
            // =====================================================

            subscription.Amount =
                subscription.BillingCycle.Equals(
                    "Annual",
                    StringComparison.OrdinalIgnoreCase)
                    ? currentPlan.AnnualPrice
                    : currentPlan.MonthlyPrice;

            // =====================================================
            // UPDATE BILLING DATE
            // =====================================================

            if (subscription.Status != "CANCELLED" &&
                subscription.Status != "EXPIRED")
            {
                subscription.NextBillingDate =
                    CalculateNextBillingDate(
                        subscription.StartDate,
                        subscription.BillingCycle);
            }

            subscription.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message =
                    "Subscription updated successfully.",

                subscription =
                    ToResponseDto(
                        subscription,
                        currentPlan.PlanName)
            });
        }

        // =========================================================
        // CANCEL
        // POST: api/Subscriptions/{id}/cancel
        // =========================================================

        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> CancelSubscription(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid subscription ID."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId == id);

            if (subscription == null)
            {
                return NotFound(new
                {
                    message =
                        "Subscription not found."
                });
            }

            var currentStatus =
                subscription.Status
                    .Trim()
                    .ToUpperInvariant();

            if (currentStatus == "CANCELLED")
            {
                return BadRequest(new
                {
                    message =
                        "Subscription is already cancelled."
                });
            }

            if (currentStatus == "EXPIRED")
            {
                return BadRequest(new
                {
                    message =
                        "An expired subscription cannot be cancelled."
                });
            }

            var now = DateTime.UtcNow;

            subscription.Status =
                "CANCELLED";

            subscription.CancelledDate =
                now;

            subscription.EndDate =
                now;

            subscription.NextBillingDate =
                null;

            subscription.UpdatedDate =
                now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Subscription cancelled successfully.",

                subscription =
                    ToResponseDto(
                        subscription,
                        null)
            });
        }

        // =========================================================
        // RENEW
        // POST: api/Subscriptions/{id}/renew
        // =========================================================

        [HttpPost("{id:int}/renew")]
        public async Task<IActionResult> RenewSubscription(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid subscription ID."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId == id);

            if (subscription == null)
            {
                return NotFound(new
                {
                    message =
                        "Subscription not found."
                });
            }

            var currentStatus =
                subscription.Status
                    .Trim()
                    .ToUpperInvariant();

            if (!RenewableStatuses.Contains(
                currentStatus))
            {
                return BadRequest(new
                {
                    message =
                        $"A subscription with status '{subscription.Status}' cannot be renewed."
                });
            }

            var plan =
                await _context.SubscriptionPlans
                    .FirstOrDefaultAsync(p =>
                        p.SubscriptionPlanId ==
                        subscription.SubscriptionPlanId &&
                        p.IsActive);

            if (plan == null)
            {
                return BadRequest(new
                {
                    message =
                        "The subscription does not have a valid active subscription plan."
                });
            }

            var now =
                DateTime.UtcNow;

            var amount =
                subscription.BillingCycle.Equals(
                    "Annual",
                    StringComparison.OrdinalIgnoreCase)
                    ? plan.AnnualPrice
                    : plan.MonthlyPrice;

            subscription.Status =
                "ACTIVE";

            subscription.Amount =
                amount;

            subscription.Currency =
                "PHP";

            subscription.StartDate =
                now;

            subscription.EndDate =
                null;

            subscription.CancelledDate =
                null;

            subscription.NextBillingDate =
                CalculateNextBillingDate(
                    now,
                    subscription.BillingCycle);

            subscription.UpdatedDate =
                now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,

                message =
                    "Subscription renewed successfully.",

                subscription =
                    ToResponseDto(
                        subscription,
                        plan.PlanName)
            });
        }

        // =========================================================
        // PAYMENT HISTORY
        // GET: api/Subscriptions/{id}/payments
        // =========================================================

        [HttpGet("{id:int}/payments")]
        public async Task<IActionResult> GetPayments(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid subscription ID."
                });
            }

            var exists =
                await _context.Subscriptions
                    .AnyAsync(s =>
                        s.SubscriptionId == id);

            if (!exists)
            {
                return NotFound(new
                {
                    message =
                        "Subscription not found."
                });
            }

            var payments =
                await _context.Payments
                    .AsNoTracking()
                    .Where(p =>
                        p.SubscriptionId == id)
                    .OrderByDescending(p =>
                        p.CreatedDate)
                    .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // ACTIVE / TRIAL
        // GET: api/Subscriptions/active
        // =========================================================

        [HttpGet("active")]
        public async Task<IActionResult>
            GetActiveSubscriptions()
        {
            var subscriptions =
                await _context.Subscriptions
                    .AsNoTracking()
                    .Where(s =>
                        s.Status == "TRIAL" ||
                        s.Status == "ACTIVE")
                    .Select(ToResponse())
                    .OrderByDescending(s =>
                        s.CreatedDate)
                    .ToListAsync();

            return Ok(subscriptions);
        }

        // =========================================================
        // BY STATUS
        // GET: api/Subscriptions/status/{status}
        // =========================================================

        [HttpGet("status/{status}")]
        public async Task<IActionResult>
            GetByStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return BadRequest(new
                {
                    message =
                        "Subscription status is required."
                });
            }

            var normalizedStatus =
                status.Trim().ToUpperInvariant();

            if (!AllowedStatuses.Contains(
                normalizedStatus))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid subscription status."
                });
            }

            var subscriptions =
                await _context.Subscriptions
                    .AsNoTracking()
                    .Where(s =>
                        s.Status ==
                        normalizedStatus)
                    .Select(ToResponse())
                    .OrderByDescending(s =>
                        s.CreatedDate)
                    .ToListAsync();

            return Ok(subscriptions);
        }

        // =========================================================
        // HELPERS
        // =========================================================

        private static string? NormalizeBillingCycle(
            string? billingCycle)
        {
            if (string.IsNullOrWhiteSpace(
                billingCycle))
            {
                return null;
            }

            var value =
                billingCycle.Trim();

            if (value.Equals(
                "Monthly",
                StringComparison.OrdinalIgnoreCase))
            {
                return "Monthly";
            }

            if (value.Equals(
                "Annual",
                StringComparison.OrdinalIgnoreCase))
            {
                return "Annual";
            }

            return null;
        }

        private static DateTime
            CalculateNextBillingDate(
                DateTime startDate,
                string billingCycle)
        {
            return billingCycle.Equals(
                "Annual",
                StringComparison.OrdinalIgnoreCase)
                ? startDate.AddYears(1)
                : startDate.AddMonths(1);
        }

        private static Expression
            <Func<Subscription,
                SubscriptionResponseDto>>
            ToResponse()
        {
            return s =>
                new SubscriptionResponseDto
                {
                    SubscriptionId =
                        s.SubscriptionId,

                    CustomerId =
                        s.CustomerId,

                    ChurchName =
                        s.ChurchName,

                    ContactName =
                        s.ContactName,

                    ContactEmail =
                        s.ContactEmail,

                    ContactPhone =
                        s.ContactPhone,

                    SubscriptionPlanId =
                        s.SubscriptionPlanId,

                    PlanName =
                        s.SubscriptionPlan != null
                            ? s.SubscriptionPlan.PlanName
                            : null,

                    BillingCycle =
                        s.BillingCycle,

                    Amount =
                        s.Amount,

                    Currency =
                        s.Currency,

                    Status =
                        s.Status,

                    StartDate =
                        s.StartDate,

                    TrialEndsAt =
                        s.TrialEndsAt,

                    NextBillingDate =
                        s.NextBillingDate,

                    EndDate =
                        s.EndDate,

                    CancelledDate =
                        s.CancelledDate,

                    Notes =
                        s.Notes,

                    CreatedDate =
                        s.CreatedDate,

                    UpdatedDate =
                        s.UpdatedDate
                };
        }

        private static SubscriptionResponseDto
            ToResponseDto(
                Subscription s,
                string? planName)
        {
            return new SubscriptionResponseDto
            {
                SubscriptionId =
                    s.SubscriptionId,

                CustomerId =
                    s.CustomerId,

                ChurchName =
                    s.ChurchName,

                ContactName =
                    s.ContactName,

                ContactEmail =
                    s.ContactEmail,

                ContactPhone =
                    s.ContactPhone,

                SubscriptionPlanId =
                    s.SubscriptionPlanId,

                PlanName =
                    planName,

                BillingCycle =
                    s.BillingCycle,

                Amount =
                    s.Amount,

                Currency =
                    s.Currency,

                Status =
                    s.Status,

                StartDate =
                    s.StartDate,

                TrialEndsAt =
                    s.TrialEndsAt,

                NextBillingDate =
                    s.NextBillingDate,

                EndDate =
                    s.EndDate,

                CancelledDate =
                    s.CancelledDate,

                Notes =
                    s.Notes,

                CreatedDate =
                    s.CreatedDate,

                UpdatedDate =
                    s.UpdatedDate
            };
        }
    }

    // =============================================================
    // RESPONSE DTO
    // =============================================================

    public class SubscriptionResponseDto
    {
        public int SubscriptionId { get; set; }

        public int CustomerId { get; set; }

        public string? ChurchName { get; set; }

        public string? ContactName { get; set; }

        public string? ContactEmail { get; set; }

        public string? ContactPhone { get; set; }

        public int SubscriptionPlanId { get; set; }

        public string? PlanName { get; set; }

        public string BillingCycle { get; set; }
            = "Monthly";

        public decimal Amount { get; set; }

        public string Currency { get; set; }
            = "PHP";

        public string Status { get; set; }
            = "TRIAL";

        public DateTime StartDate { get; set; }

        public DateTime? TrialEndsAt { get; set; }

        public DateTime? NextBillingDate { get; set; }

        public DateTime? EndDate { get; set; }

        public DateTime? CancelledDate { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }

    // =============================================================
    // CREATE DTO
    // =============================================================

    public class CreateSubscriptionDto
    {
        [Required]
        public int CustomerId { get; set; }

        [Required]
        public int SubscriptionPlanId { get; set; }

        public string BillingCycle { get; set; }
            = "Monthly";

        public string? Notes { get; set; }
    }

    // =============================================================
    // UPDATE DTO
    // =============================================================

    public class UpdateSubscriptionDto
    {
        public int? CustomerId { get; set; }

        public int? SubscriptionPlanId { get; set; }

        public string? BillingCycle { get; set; }

        public string? Status { get; set; }

        public string? Notes { get; set; }
    }
}