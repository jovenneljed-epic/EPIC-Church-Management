using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN")]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // =========================================================
        // CONSTANTS
        // =========================================================

        private static readonly string[] AllowedStatuses =
        {
            "PENDING",
            "PAID",
            "FAILED",
            "REFUNDED",
            "CANCELLED"
        };

        private static readonly string[] AllowedPaymentMethods =
        {
            "Manual",
            "GCash",
            "Maya",
            "BankTransfer",
            "Card",
            "PayMongo"
        };

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        public PaymentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL PAYMENTS
        // GET: api/Payments
        // =========================================================

        [HttpGet]
        [Permission("Payments", "view")]
        public async Task<IActionResult> GetPayments()
        {
            var payments = await BuildPaymentQuery()
                .OrderByDescending(p => p.CreatedDate)
                .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // GET PAYMENT BY ID
        // GET: api/Payments/{id}
        // =========================================================

        [HttpGet("{id:int}")]
        [Permission("Payments", "view")]
        public async Task<IActionResult> GetPayment(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid payment ID."
                });
            }

            var payment = await BuildPaymentQuery()
                .Where(p => p.PaymentId == id)
                .FirstOrDefaultAsync();

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            return Ok(payment);
        }

        // =========================================================
        // GET PAYMENTS BY SUBSCRIPTION
        // GET: api/Payments/subscription/{subscriptionId}
        // =========================================================

        [HttpGet("subscription/{subscriptionId:int}")]
        [Permission("Payments", "view")]
        public async Task<IActionResult> GetPaymentsBySubscription(
            int subscriptionId)
        {
            if (subscriptionId <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid subscription ID."
                });
            }

            var subscriptionExists =
                await _context.Subscriptions
                    .AsNoTracking()
                    .AnyAsync(s =>
                        s.SubscriptionId == subscriptionId);

            if (!subscriptionExists)
            {
                return NotFound(new
                {
                    message = "Subscription not found."
                });
            }

            var payments = await BuildPaymentQuery()
                .Where(p =>
                    p.SubscriptionId == subscriptionId)
                .OrderByDescending(p =>
                    p.CreatedDate)
                .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // GET PAYMENTS BY STATUS
        // GET: api/Payments/status/{status}
        // =========================================================

        [HttpGet("status/{status}")]
        [Permission("Payments", "view")]
        public async Task<IActionResult> GetPaymentsByStatus(
            string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return BadRequest(new
                {
                    message = "Payment status is required."
                });
            }

            var normalizedStatus =
                NormalizeStatus(status);

            if (normalizedStatus == null)
            {
                return BadRequest(new
                {
                    message = "Invalid payment status."
                });
            }

            var payments = await BuildPaymentQuery()
                .Where(p =>
                    p.Status == normalizedStatus)
                .OrderByDescending(p =>
                    p.CreatedDate)
                .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // PAYMENT SUMMARY
        // GET: api/Payments/summary
        // =========================================================

        [HttpGet("summary")]
        [Permission("Payments", "view")]
        public async Task<IActionResult> GetPaymentSummary()
        {
            var now = DateTime.UtcNow;

            var monthStart = new DateTime(
                now.Year,
                now.Month,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc);

            var monthEnd =
                monthStart.AddMonths(1);

            var payments =
                _context.Payments
                    .AsNoTracking();

            var total =
                await payments.CountAsync();

            var paid =
                await payments.CountAsync(p =>
                    p.Status == "PAID");

            var pending =
                await payments.CountAsync(p =>
                    p.Status == "PENDING");

            var failed =
                await payments.CountAsync(p =>
                    p.Status == "FAILED");

            var refunded =
                await payments.CountAsync(p =>
                    p.Status == "REFUNDED");

            var cancelled =
                await payments.CountAsync(p =>
                    p.Status == "CANCELLED");

            var totalRevenue =
                await payments
                    .Where(p =>
                        p.Status == "PAID")
                    .Select(p =>
                        (decimal?)p.Amount)
                    .SumAsync() ?? 0m;

            var currentMonthRevenue =
                await payments
                    .Where(p =>
                        p.Status == "PAID" &&
                        p.PaidDate.HasValue &&
                        p.PaidDate.Value >= monthStart &&
                        p.PaidDate.Value < monthEnd)
                    .Select(p =>
                        (decimal?)p.Amount)
                    .SumAsync() ?? 0m;

            return Ok(new
            {
                generatedAt = DateTime.UtcNow,

                payments = new
                {
                    total,
                    paid,
                    pending,
                    failed,
                    refunded,
                    cancelled
                },

                revenue = new
                {
                    total = totalRevenue,
                    currentMonth = currentMonthRevenue
                }
            });
        }

        // =========================================================
        // CREATE PAYMENT
        // POST: api/Payments
        // =========================================================

        [HttpPost]
        [Permission("Payments", "create")]
        public async Task<IActionResult> CreatePayment(
            [FromBody] CreatePaymentDto request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Payment data is required."
                });
            }

            if (request.SubscriptionId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "A valid subscription is required."
                });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Payment amount must be greater than zero."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId ==
                        request.SubscriptionId);

            if (subscription == null)
            {
                return NotFound(new
                {
                    message = "Subscription not found."
                });
            }

            var paymentMethod =
                NormalizePaymentMethod(
                    request.PaymentMethod);

            if (paymentMethod == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid payment method."
                });
            }

            var status =
                NormalizeStatus(
                    request.Status);

            if (status == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid payment status."
                });
            }

            var now =
                DateTime.UtcNow;

            var payment = new Payment
            {
                SubscriptionId =
                    subscription.SubscriptionId,

                Amount =
                    request.Amount,

                Currency =
                    NormalizeCurrency(
                        request.Currency),

                PaymentMethod =
                    paymentMethod,

                Status =
                    status,

                ReferenceNumber =
                    Clean(request.ReferenceNumber),

                GatewayPaymentId =
                    Clean(request.GatewayPaymentId),

                GatewayCheckoutId =
                    Clean(request.GatewayCheckoutId),

                GatewayCustomerId =
                    Clean(request.GatewayCustomerId),

                BillingPeriodStart =
                    request.BillingPeriodStart,

                BillingPeriodEnd =
                    request.BillingPeriodEnd,

                InvoiceNumber =
                    Clean(request.InvoiceNumber),

                ReceiptNumber =
                    Clean(request.ReceiptNumber),

                FailureReason =
                    Clean(request.FailureReason),

                Notes =
                    Clean(request.Notes),

                CreatedDate =
                    now,

                UpdatedDate =
                    now
            };

            ApplyPaymentStatus(
                payment,
                subscription,
                status,
                now);

            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetPayment),
                new
                {
                    id = payment.PaymentId
                },
                new
                {
                    success = true,
                    message =
                        "Payment created successfully.",
                    paymentId =
                        payment.PaymentId,
                    subscriptionId =
                        payment.SubscriptionId,
                    amount =
                        payment.Amount,
                    currency =
                        payment.Currency,
                    paymentMethod =
                        payment.PaymentMethod,
                    status =
                        payment.Status,
                    paidDate =
                        payment.PaidDate,
                    failedDate =
                        payment.FailedDate,
                    createdDate =
                        payment.CreatedDate
                });
        }

        // =========================================================
        // UPDATE PAYMENT
        // PUT: api/Payments/{id}
        // =========================================================

        [HttpPut("{id:int}")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> UpdatePayment(
            int id,
            [FromBody] UpdatePaymentDto request)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid payment ID."
                });
            }

            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Payment data is required."
                });
            }

            var payment =
                await _context.Payments
                    .FirstOrDefaultAsync(p =>
                        p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            if (request.Amount.HasValue &&
                request.Amount.Value <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Payment amount must be greater than zero."
                });
            }

            if (request.Amount.HasValue)
            {
                payment.Amount =
                    request.Amount.Value;
            }

            if (!string.IsNullOrWhiteSpace(
                request.Currency))
            {
                payment.Currency =
                    NormalizeCurrency(
                        request.Currency);
            }

            if (!string.IsNullOrWhiteSpace(
                request.PaymentMethod))
            {
                var method =
                    NormalizePaymentMethod(
                        request.PaymentMethod);

                if (method == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid payment method."
                    });
                }

                payment.PaymentMethod =
                    method;
            }

            if (request.ReferenceNumber != null)
            {
                payment.ReferenceNumber =
                    Clean(request.ReferenceNumber);
            }

            if (request.GatewayPaymentId != null)
            {
                payment.GatewayPaymentId =
                    Clean(request.GatewayPaymentId);
            }

            if (request.GatewayCheckoutId != null)
            {
                payment.GatewayCheckoutId =
                    Clean(request.GatewayCheckoutId);
            }

            if (request.GatewayCustomerId != null)
            {
                payment.GatewayCustomerId =
                    Clean(request.GatewayCustomerId);
            }

            if (request.BillingPeriodStart.HasValue)
            {
                payment.BillingPeriodStart =
                    request.BillingPeriodStart;
            }

            if (request.BillingPeriodEnd.HasValue)
            {
                payment.BillingPeriodEnd =
                    request.BillingPeriodEnd;
            }

            if (request.InvoiceNumber != null)
            {
                payment.InvoiceNumber =
                    Clean(request.InvoiceNumber);
            }

            if (request.ReceiptNumber != null)
            {
                payment.ReceiptNumber =
                    Clean(request.ReceiptNumber);
            }

            if (request.FailureReason != null)
            {
                payment.FailureReason =
                    Clean(request.FailureReason);
            }

            if (request.Notes != null)
            {
                payment.Notes =
                    Clean(request.Notes);
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId ==
                        payment.SubscriptionId);

            if (subscription == null)
            {
                return BadRequest(new
                {
                    message =
                        "The payment subscription could not be found."
                });
            }

            if (!string.IsNullOrWhiteSpace(
                request.Status))
            {
                var status =
                    NormalizeStatus(
                        request.Status);

                if (status == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Invalid payment status."
                    });
                }

                ApplyPaymentStatus(
                    payment,
                    subscription,
                    status,
                    DateTime.UtcNow);
            }

            payment.UpdatedDate =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message =
                    "Payment updated successfully.",
                payment = await BuildPaymentQuery()
                    .Where(p =>
                        p.PaymentId == id)
                    .FirstOrDefaultAsync()
            });
        }

        // =========================================================
        // MARK AS PAID
        // POST: api/Payments/{id}/mark-paid
        // =========================================================

        [HttpPost("{id:int}/mark-paid")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> MarkAsPaid(
            int id)
        {
            return await ChangePaymentStatus(
                id,
                "PAID");
        }

        // =========================================================
        // MARK AS FAILED
        // POST: api/Payments/{id}/mark-failed
        // =========================================================

        [HttpPost("{id:int}/mark-failed")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> MarkAsFailed(
            int id)
        {
            return await ChangePaymentStatus(
                id,
                "FAILED");
        }

        // =========================================================
        // REFUND
        // POST: api/Payments/{id}/refund
        // =========================================================

        [HttpPost("{id:int}/refund")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> RefundPayment(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid payment ID."
                });
            }

            var payment =
                await _context.Payments
                    .FirstOrDefaultAsync(p =>
                        p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            if (payment.Status != "PAID")
            {
                return BadRequest(new
                {
                    message =
                        "Only paid payments can be refunded."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId ==
                        payment.SubscriptionId);

            if (subscription == null)
            {
                return BadRequest(new
                {
                    message =
                        "The payment subscription could not be found."
                });
            }

            var now =
                DateTime.UtcNow;

            ApplyPaymentStatus(
                payment,
                subscription,
                "REFUNDED",
                now);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message =
                    "Payment refunded successfully.",
                paymentId =
                    payment.PaymentId,
                status =
                    payment.Status,
                subscriptionId =
                    subscription.SubscriptionId,
                subscriptionStatus =
                    subscription.Status
            });
        }

        // =========================================================
        // DELETE PAYMENT
        // DELETE: api/Payments/{id}
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Payments", "delete")]
        public async Task<IActionResult> DeletePayment(
            int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid payment ID."
                });
            }

            var payment =
                await _context.Payments
                    .FirstOrDefaultAsync(p =>
                        p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            if (payment.Status == "PAID" ||
                payment.Status == "REFUNDED")
            {
                return BadRequest(new
                {
                    message =
                        "Completed or refunded payments cannot be deleted."
                });
            }

            _context.Payments.Remove(payment);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // =========================================================
        // INTERNAL STATUS HANDLER
        // =========================================================

        private async Task<IActionResult> ChangePaymentStatus(
            int id,
            string status)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid payment ID."
                });
            }

            var normalizedStatus =
                NormalizeStatus(status);

            if (normalizedStatus == null)
            {
                return BadRequest(new
                {
                    message = "Invalid payment status."
                });
            }

            var payment =
                await _context.Payments
                    .FirstOrDefaultAsync(p =>
                        p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            if (payment.Status ==
                normalizedStatus)
            {
                return BadRequest(new
                {
                    message =
                        $"Payment is already {normalizedStatus}."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId ==
                        payment.SubscriptionId);

            if (subscription == null)
            {
                return BadRequest(new
                {
                    message =
                        "The payment subscription could not be found."
                });
            }

            var now =
                DateTime.UtcNow;

            ApplyPaymentStatus(
                payment,
                subscription,
                normalizedStatus,
                now);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message =
                    $"Payment marked as {normalizedStatus.ToLowerInvariant()}.",
                paymentId =
                    payment.PaymentId,
                status =
                    payment.Status,
                paidDate =
                    payment.PaidDate,
                failedDate =
                    payment.FailedDate,
                subscriptionId =
                    subscription.SubscriptionId,
                subscriptionStatus =
                    subscription.Status,
                nextBillingDate =
                    subscription.NextBillingDate
            });
        }

        // =========================================================
        // PAYMENT STATUS SYNCHRONIZATION
        // =========================================================

        private static void ApplyPaymentStatus(
            Payment payment,
            Subscription subscription,
            string status,
            DateTime now)
        {
            payment.Status =
                status;

            payment.UpdatedDate =
                now;

            switch (status)
            {
                case "PAID":

                    payment.PaidDate ??= now;
                    payment.FailedDate = null;

                    subscription.Status =
                        "ACTIVE";

                    subscription.CancelledDate =
                        null;

                    subscription.EndDate =
                        null;

                    subscription.NextBillingDate =
                        string.Equals(
                            subscription.BillingCycle,
                            "Annual",
                            StringComparison.OrdinalIgnoreCase)
                            ? now.AddYears(1)
                            : now.AddMonths(1);

                    subscription.UpdatedDate =
                        now;

                    break;

                case "FAILED":

                    payment.FailedDate =
                        now;

                    payment.PaidDate =
                        null;

                    subscription.Status =
                        "PAST_DUE";

                    subscription.UpdatedDate =
                        now;

                    break;

                case "CANCELLED":

                    payment.PaidDate =
                        null;

                    payment.FailedDate =
                        null;

                    subscription.Status =
                        "CANCELLED";

                    subscription.CancelledDate =
                        now;

                    subscription.EndDate =
                        now;

                    subscription.UpdatedDate =
                        now;

                    break;

                case "REFUNDED":

                    subscription.Status =
                        "PAST_DUE";

                    subscription.UpdatedDate =
                        now;

                    break;

                case "PENDING":

                    payment.PaidDate =
                        null;

                    payment.FailedDate =
                        null;

                    break;
            }
        }

        // =========================================================
        // PAYMENT QUERY
        // =========================================================
        //
        // IMPORTANT:
        // Never return Payment entities directly.
        // This prevents:
        //
        // Payment
        //   -> Subscription
        //      -> SubscriptionPlan
        //         -> Subscriptions
        //            -> SubscriptionPlan
        //               -> ...
        //
        // =========================================================

        private IQueryable<PaymentResponseDto>
            BuildPaymentQuery()
        {
            return _context.Payments
                .AsNoTracking()
                .Select(p => new PaymentResponseDto
                {
                    PaymentId =
                        p.PaymentId,

                    SubscriptionId =
                        p.SubscriptionId,

                    ChurchName =
                        p.Subscription != null
                            ? p.Subscription.ChurchName
                            : null,

                    ContactName =
                        p.Subscription != null
                            ? p.Subscription.ContactName
                            : null,

                    ContactEmail =
                        p.Subscription != null
                            ? p.Subscription.ContactEmail
                            : null,

                    ContactPhone =
                        p.Subscription != null
                            ? p.Subscription.ContactPhone
                            : null,

                    PlanName =
                        p.Subscription != null &&
                        p.Subscription.SubscriptionPlan != null
                            ? p.Subscription.SubscriptionPlan.PlanName
                            : null,

                    BillingCycle =
                        p.Subscription != null
                            ? p.Subscription.BillingCycle
                            : null,

                    Amount =
                        p.Amount,

                    Currency =
                        p.Currency,

                    PaymentMethod =
                        p.PaymentMethod,

                    Status =
                        p.Status,

                    ReferenceNumber =
                        p.ReferenceNumber,

                    GatewayPaymentId =
                        p.GatewayPaymentId,

                    GatewayCheckoutId =
                        p.GatewayCheckoutId,

                    GatewayCustomerId =
                        p.GatewayCustomerId,

                    BillingPeriodStart =
                        p.BillingPeriodStart,

                    BillingPeriodEnd =
                        p.BillingPeriodEnd,

                    InvoiceNumber =
                        p.InvoiceNumber,

                    ReceiptNumber =
                        p.ReceiptNumber,

                    PaidDate =
                        p.PaidDate,

                    FailedDate =
                        p.FailedDate,

                    FailureReason =
                        p.FailureReason,

                    Notes =
                        p.Notes,

                    CreatedDate =
                        p.CreatedDate,

                    UpdatedDate =
                        p.UpdatedDate
                });
        }

        // =========================================================
        // VALIDATION HELPERS
        // =========================================================

        private static string? NormalizeStatus(
            string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return "PENDING";
            }

            var normalized =
                status.Trim()
                    .ToUpperInvariant();

            return AllowedStatuses.Contains(
                normalized)
                ? normalized
                : null;
        }

        private static string? NormalizePaymentMethod(
            string? method)
        {
            if (string.IsNullOrWhiteSpace(method))
            {
                return "Manual";
            }

            var value =
                method.Trim();

            return AllowedPaymentMethods
                .FirstOrDefault(x =>
                    x.Equals(
                        value,
                        StringComparison.OrdinalIgnoreCase));
        }

        private static string NormalizeCurrency(
            string? currency)
        {
            if (string.IsNullOrWhiteSpace(currency))
            {
                return "PHP";
            }

            return currency
                .Trim()
                .ToUpperInvariant();
        }

        private static string? Clean(
            string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }
    }

    // =============================================================
    // PAYMENT RESPONSE DTO
    // =============================================================

    public class PaymentResponseDto
    {
        public int PaymentId { get; set; }

        public int SubscriptionId { get; set; }

        public string? ChurchName { get; set; }

        public string? ContactName { get; set; }

        public string? ContactEmail { get; set; }

        public string? ContactPhone { get; set; }

        public string? PlanName { get; set; }

        public string? BillingCycle { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "PHP";

        public string PaymentMethod { get; set; } = "Manual";

        public string Status { get; set; } = "PENDING";

        public string? ReferenceNumber { get; set; }

        public string? GatewayPaymentId { get; set; }

        public string? GatewayCheckoutId { get; set; }

        public string? GatewayCustomerId { get; set; }

        public DateTime? BillingPeriodStart { get; set; }

        public DateTime? BillingPeriodEnd { get; set; }

        public string? InvoiceNumber { get; set; }

        public string? ReceiptNumber { get; set; }

        public DateTime? PaidDate { get; set; }

        public DateTime? FailedDate { get; set; }

        public string? FailureReason { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }

    // =============================================================
    // CREATE PAYMENT DTO
    // =============================================================

    public class CreatePaymentDto
    {
        [Required]
        public int SubscriptionId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public string Currency { get; set; } = "PHP";

        public string PaymentMethod { get; set; } = "Manual";

        public string Status { get; set; } = "PENDING";

        public string? ReferenceNumber { get; set; }

        public string? GatewayPaymentId { get; set; }

        public string? GatewayCheckoutId { get; set; }

        public string? GatewayCustomerId { get; set; }

        public DateTime? BillingPeriodStart { get; set; }

        public DateTime? BillingPeriodEnd { get; set; }

        public string? InvoiceNumber { get; set; }

        public string? ReceiptNumber { get; set; }

        public string? FailureReason { get; set; }

        public string? Notes { get; set; }
    }

    // =============================================================
    // UPDATE PAYMENT DTO
    // =============================================================

    public class UpdatePaymentDto
    {
        public decimal? Amount { get; set; }

        public string? Currency { get; set; }

        public string? PaymentMethod { get; set; }

        public string? Status { get; set; }

        public string? ReferenceNumber { get; set; }

        public string? GatewayPaymentId { get; set; }

        public string? GatewayCheckoutId { get; set; }

        public string? GatewayCustomerId { get; set; }

        public DateTime? BillingPeriodStart { get; set; }

        public DateTime? BillingPeriodEnd { get; set; }

        public string? InvoiceNumber { get; set; }

        public string? ReceiptNumber { get; set; }

        public string? FailureReason { get; set; }

        public string? Notes { get; set; }
    }
}