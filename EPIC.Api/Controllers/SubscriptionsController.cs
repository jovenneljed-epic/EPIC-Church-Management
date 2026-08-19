
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        private static readonly string[] AllowedBillingCycles =
        {
            "Monthly",
            "Annual"
        };

        public SubscriptionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL SUBSCRIPTIONS
        // GET: api/Subscriptions
        // =========================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Subscription>>> GetSubscriptions()
        {
            var subscriptions = await _context.Subscriptions
                .AsNoTracking()
                .Include(s => s.SubscriptionPlan)
                .OrderByDescending(s => s.CreatedDate)
                .ToListAsync();

            return Ok(subscriptions);
        }

        // =========================================================
        // GET SUBSCRIPTION BY ID
        // GET: api/Subscriptions/5
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Subscription>> GetSubscription(int id)
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
                .Include(s => s.SubscriptionPlan)
                .FirstOrDefaultAsync(s =>
                    s.SubscriptionId == id);

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
        // CREATE SUBSCRIPTION
        // POST: api/Subscriptions
        // =========================================================

        [HttpPost]
        public async Task<ActionResult<Subscription>> CreateSubscription(
            [FromBody] Subscription request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Subscription data is required."
                });
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            // -----------------------------------------------------
            // Validate church
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(request.ChurchName))
            {
                return BadRequest(new
                {
                    message = "Church name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.ContactEmail))
            {
                return BadRequest(new
                {
                    message = "Contact email is required."
                });
            }

            // -----------------------------------------------------
            // Validate plan
            // -----------------------------------------------------

            if (request.SubscriptionPlanId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid subscription plan is required."
                });
            }

            var plan = await _context.SubscriptionPlans
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.SubscriptionPlanId == request.SubscriptionPlanId &&
                    p.IsActive);

            if (plan == null)
            {
                return BadRequest(new
                {
                    message =
                        "The selected subscription plan is not available."
                });
            }

            // -----------------------------------------------------
            // Normalize email
            // -----------------------------------------------------

            var contactEmail =
                request.ContactEmail.Trim();

            // -----------------------------------------------------
            // Prevent duplicate active subscription
            // -----------------------------------------------------

            var hasExistingSubscription =
                await _context.Subscriptions.AnyAsync(s =>
                    s.ContactEmail == contactEmail &&
                    (
                        s.Status == "TRIAL" ||
                        s.Status == "ACTIVE" ||
                        s.Status == "PAST_DUE"
                    ));

            if (hasExistingSubscription)
            {
                return Conflict(new
                {
                    message =
                        "This email already has an active or pending subscription."
                });
            }

            // -----------------------------------------------------
            // Billing cycle
            // -----------------------------------------------------

            var billingCycle =
                NormalizeBillingCycle(request.BillingCycle);

            if (billingCycle == null)
            {
                return BadRequest(new
                {
                    message =
                        "Billing cycle must be either Monthly or Annual."
                });
            }

            // -----------------------------------------------------
            // Determine price
            // -----------------------------------------------------

            var amount =
                billingCycle == "Annual"
                    ? plan.AnnualPrice
                    : plan.MonthlyPrice;

            // -----------------------------------------------------
            // Dates
            // -----------------------------------------------------

            var now = DateTime.Now;

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

            // -----------------------------------------------------
            // Create subscription
            // -----------------------------------------------------

            var subscription = new Subscription
            {
                ChurchName =
                    request.ChurchName.Trim(),

                ContactName =
                    request.ContactName?.Trim()
                    ?? string.Empty,

                ContactEmail =
                    contactEmail,

                ContactPhone =
                    request.ContactPhone?.Trim()
                    ?? string.Empty,

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

                PaymentCustomerId =
                    null,

                PaymentSubscriptionId =
                    null,

                Notes =
                    request.Notes?.Trim(),

                CreatedDate =
                    now,

                UpdatedDate =
                    null
            };

            _context.Subscriptions.Add(subscription);

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // Load plan
            // -----------------------------------------------------

            await _context.Entry(subscription)
                .Reference(s => s.SubscriptionPlan)
                .LoadAsync();

            return CreatedAtAction(
                nameof(GetSubscription),
                new
                {
                    id = subscription.SubscriptionId
                },
                subscription);
        }

        // =========================================================
        // UPDATE SUBSCRIPTION
        // PUT: api/Subscriptions/5
        // =========================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateSubscription(
            int id,
            [FromBody] Subscription request)
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
                    message = "Subscription data is required."
                });
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId == id);

            if (subscription == null)
            {
                return NotFound(new
                {
                    message = "Subscription not found."
                });
            }

            // -----------------------------------------------------
            // Validate plan
            // -----------------------------------------------------

            if (request.SubscriptionPlanId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "A valid subscription plan is required."
                });
            }

            var plan =
                await _context.SubscriptionPlans
                    .FirstOrDefaultAsync(p =>
                        p.SubscriptionPlanId ==
                        request.SubscriptionPlanId);

            if (plan == null)
            {
                return BadRequest(new
                {
                    message =
                        "Subscription plan not found."
                });
            }

            // -----------------------------------------------------
            // Billing cycle
            // -----------------------------------------------------

            var billingCycle =
                NormalizeBillingCycle(
                    request.BillingCycle);

            if (billingCycle == null)
            {
                billingCycle =
                    NormalizeBillingCycle(
                        subscription.BillingCycle);
            }

            if (billingCycle == null)
            {
                return BadRequest(new
                {
                    message =
                        "Billing cycle must be either Monthly or Annual."
                });
            }

            // -----------------------------------------------------
            // Validate church information
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                    request.ChurchName))
            {
                return BadRequest(new
                {
                    message =
                        "Church name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.ContactEmail))
            {
                return BadRequest(new
                {
                    message =
                        "Contact email is required."
                });
            }

            // -----------------------------------------------------
            // Update subscription
            // -----------------------------------------------------

            subscription.ChurchName =
                request.ChurchName.Trim();

            subscription.ContactName =
                request.ContactName?.Trim()
                ?? string.Empty;

            subscription.ContactEmail =
                request.ContactEmail.Trim();

            subscription.ContactPhone =
                request.ContactPhone?.Trim()
                ?? string.Empty;

            subscription.SubscriptionPlanId =
                plan.SubscriptionPlanId;

            subscription.BillingCycle =
                billingCycle;

            subscription.Amount =
                billingCycle == "Annual"
                    ? plan.AnnualPrice
                    : plan.MonthlyPrice;

            subscription.Currency =
                string.IsNullOrWhiteSpace(
                    request.Currency)
                    ? "PHP"
                    : request.Currency
                        .Trim()
                        .ToUpperInvariant();

            subscription.Notes =
                request.Notes?.Trim();

            // -----------------------------------------------------
            // Status
            // -----------------------------------------------------

            if (!string.IsNullOrWhiteSpace(
                    request.Status))
            {
                var normalizedStatus =
                    request.Status
                        .Trim()
                        .ToUpperInvariant();

                if (!AllowedStatuses.Contains(
                        normalizedStatus))
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid subscription status."
                    });
                }

                subscription.Status =
                    normalizedStatus;
            }

            subscription.UpdatedDate =
                DateTime.Now;

            await _context.SaveChangesAsync();

            await _context.Entry(subscription)
                .Reference(s => s.SubscriptionPlan)
                .LoadAsync();

            return Ok(subscription);
        }

        // =========================================================
        // CANCEL SUBSCRIPTION
        // POST: api/Subscriptions/5/cancel
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

            if (subscription.Status ==
                "CANCELLED")
            {
                return BadRequest(new
                {
                    message =
                        "Subscription is already cancelled."
                });
            }

            var now = DateTime.Now;

            subscription.Status =
                "CANCELLED";

            subscription.CancelledDate =
                now;

            subscription.EndDate =
                now;

            subscription.UpdatedDate =
                now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Subscription cancelled successfully.",

                subscriptionId =
                    subscription.SubscriptionId,

                status =
                    subscription.Status,

                cancelledDate =
                    subscription.CancelledDate
            });
        }

        // =========================================================
        // RENEW SUBSCRIPTION
        // POST: api/Subscriptions/5/renew
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
                    .Include(s => s.SubscriptionPlan)
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

            if (subscription.SubscriptionPlan == null)
            {
                return BadRequest(new
                {
                    message =
                        "The subscription does not have a valid subscription plan."
                });
            }

            if (subscription.Status ==
                "CANCELLED")
            {
                return BadRequest(new
                {
                    message =
                        "A cancelled subscription cannot be renewed."
                });
            }

            var now =
                DateTime.Now;

            subscription.Status =
                "ACTIVE";

            subscription.CancelledDate =
                null;

            subscription.EndDate =
                null;

            subscription.NextBillingDate =
                CalculateNextBillingDate(
                    now,
                    subscription.BillingCycle);

            subscription.Amount =
                subscription.BillingCycle ==
                "Annual"
                    ? subscription.SubscriptionPlan.AnnualPrice
                    : subscription.SubscriptionPlan.MonthlyPrice;

            subscription.UpdatedDate =
                now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Subscription renewed successfully.",

                subscriptionId =
                    subscription.SubscriptionId,

                status =
                    subscription.Status,

                amount =
                    subscription.Amount,

                nextBillingDate =
                    subscription.NextBillingDate
            });
        }

        // =========================================================
        // GET PAYMENT HISTORY
        // GET: api/Subscriptions/5/payments
        // =========================================================

        [HttpGet("{id:int}/payments")]
        public async Task<ActionResult<IEnumerable<Payment>>>
            GetPayments(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid subscription ID."
                });
            }

            var subscriptionExists =
                await _context.Subscriptions
                    .AnyAsync(s =>
                        s.SubscriptionId == id);

            if (!subscriptionExists)
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
        // GET ACTIVE SUBSCRIPTIONS
        // GET: api/Subscriptions/active
        // =========================================================

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<Subscription>>>
            GetActiveSubscriptions()
        {
            var subscriptions =
                await _context.Subscriptions
                    .AsNoTracking()
                    .Include(s => s.SubscriptionPlan)
                    .Where(s =>
                        s.Status == "TRIAL" ||
                        s.Status == "ACTIVE")
                    .OrderByDescending(s =>
                        s.CreatedDate)
                    .ToListAsync();

            return Ok(subscriptions);
        }

        // =========================================================
        // GET SUBSCRIPTIONS BY STATUS
        // GET: api/Subscriptions/status/ACTIVE
        // =========================================================

        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<Subscription>>>
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
                    .Include(s => s.SubscriptionPlan)
                    .Where(s =>
                        s.Status == normalizedStatus)
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

            var normalized =
                billingCycle.Trim();

            if (normalized.Equals(
                    "Monthly",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "Monthly";
            }

            if (normalized.Equals(
                    "Annual",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "Annual";
            }

            return null;
        }

        private static DateTime CalculateNextBillingDate(
            DateTime startDate,
            string billingCycle)
        {
            return billingCycle.Equals(
                    "Annual",
                    StringComparison.OrdinalIgnoreCase)
                ? startDate.AddYears(1)
                : startDate.AddMonths(1);
        }
    }
}

