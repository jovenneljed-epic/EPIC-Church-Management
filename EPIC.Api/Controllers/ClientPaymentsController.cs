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
    public class ClientPaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly string[] AllowedPaymentMethods =
        {
            "Manual",
            "GCash",
            "Maya",
            "BankTransfer",
            "Card",
            "PayMongo"
        };

        public ClientPaymentsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET PAYMENT INFORMATION
        // GET:
        // api/ClientPayments/subscription/{subscriptionId}
        // =========================================================

        [HttpGet("subscription/{subscriptionId:int}")]
        public async Task<IActionResult> GetPaymentInformation(
            int subscriptionId)
        {
            if (subscriptionId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid subscription ID."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .AsNoTracking()
                    .Where(s =>
                        s.SubscriptionId == subscriptionId)
                    .Select(s => new
                    {
                        subscriptionId =
                            s.SubscriptionId,

                        customerId =
                            s.CustomerId,

                        churchName =
                            s.ChurchName,

                        contactName =
                            s.ContactName,

                        contactEmail =
                            s.ContactEmail,

                        contactPhone =
                            s.ContactPhone,

                        subscriptionPlanId =
                            s.SubscriptionPlanId,

                        planName =
                            s.SubscriptionPlan != null
                                ? s.SubscriptionPlan.PlanName
                                : null,

                        billingCycle =
                            s.BillingCycle,

                        amount =
                            s.Amount,

                        currency =
                            s.Currency,

                        status =
                            s.Status,

                        startDate =
                            s.StartDate,

                        trialEndsAt =
                            s.TrialEndsAt,

                        nextBillingDate =
                            s.NextBillingDate,

                        endDate =
                            s.EndDate,

                        cancelledDate =
                            s.CancelledDate,

                        notes =
                            s.Notes
                    })
                    .FirstOrDefaultAsync();

            if (subscription == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Subscription not found."
                });
            }

            return Ok(new
            {
                success = true,
                subscription
            });
        }

        // =========================================================
        // GET PAYMENT HISTORY
        // GET:
        // api/ClientPayments/subscription/{subscriptionId}/history
        // =========================================================

        [HttpGet("subscription/{subscriptionId:int}/history")]
        public async Task<IActionResult> GetPaymentHistory(
            int subscriptionId)
        {
            if (subscriptionId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
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
                    success = false,
                    message = "Subscription not found."
                });
            }

            var payments =
                await _context.Payments
                    .AsNoTracking()
                    .Where(p =>
                        p.SubscriptionId ==
                        subscriptionId)
                    .OrderByDescending(
                        p => p.CreatedDate)
                    .Select(p => new
                    {
                        paymentId =
                            p.PaymentId,

                        subscriptionId =
                            p.SubscriptionId,

                        amount =
                            p.Amount,

                        currency =
                            p.Currency,

                        paymentMethod =
                            p.PaymentMethod,

                        status =
                            p.Status,

                        referenceNumber =
                            p.ReferenceNumber,

                        invoiceNumber =
                            p.InvoiceNumber,

                        receiptNumber =
                            p.ReceiptNumber,

                        billingPeriodStart =
                            p.BillingPeriodStart,

                        billingPeriodEnd =
                            p.BillingPeriodEnd,

                        paidDate =
                            p.PaidDate,

                        failedDate =
                            p.FailedDate,

                        failureReason =
                            p.FailureReason,

                        notes =
                            p.Notes,

                        createdDate =
                            p.CreatedDate,

                        updatedDate =
                            p.UpdatedDate
                    })
                    .ToListAsync();

            return Ok(new
            {
                success = true,
                payments
            });
        }

        // =========================================================
        // CREATE PAYMENT
        // POST:
        // api/ClientPayments/subscription/{subscriptionId}
        // =========================================================

        [HttpPost("subscription/{subscriptionId:int}")]
        public async Task<IActionResult> CreateClientPayment(
            int subscriptionId,
            [FromBody] ClientPaymentRequest request)
        {
            if (subscriptionId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid subscription ID."
                });
            }

            if (request == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Payment information is required."
                });
            }

            var subscription =
                await _context.Subscriptions
                    .Include(s =>
                        s.SubscriptionPlan)
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId ==
                        subscriptionId);

            if (subscription == null)
            {
                return NotFound(new
                {
                    success = false,
                    message =
                        "Subscription not found."
                });
            }

            // =====================================================
            // PAYMENT METHOD
            // =====================================================

            var paymentMethod =
                NormalizePaymentMethod(
                    request.PaymentMethod);

            if (paymentMethod == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Invalid payment method."
                });
            }

            // =====================================================
            // AMOUNT
            // =====================================================

            if (request.Amount.HasValue &&
                request.Amount.Value <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Payment amount must be greater than zero."
                });
            }

            /*
             * IMPORTANT:
             *
             * Never trust the amount sent by the frontend.
             *
             * The subscription amount stored in SQL Server
             * is the authoritative amount.
             */

            var amount =
                subscription.Amount;

            if (amount <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "The subscription does not have a valid payment amount."
                });
            }

            // =====================================================
            // REFERENCE
            // =====================================================

            var referenceNumber =
                Clean(
                    request.ReferenceNumber);

            if (
                paymentMethod != "Card" &&
                paymentMethod != "PayMongo" &&
                string.IsNullOrWhiteSpace(
                    referenceNumber)
            )
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "A payment reference number is required."
                });
            }

            // =====================================================
            // DUPLICATE PENDING PAYMENT
            // =====================================================

            var existingPendingPayment =
                await _context.Payments
                    .AsNoTracking()
                    .Where(p =>
                        p.SubscriptionId ==
                            subscription.SubscriptionId &&
                        p.Status == "PENDING")
                    .OrderByDescending(
                        p => p.CreatedDate)
                    .FirstOrDefaultAsync();

            if (existingPendingPayment != null)
            {
                return Conflict(new
                {
                    success = false,
                    message =
                        "There is already a pending payment for this subscription.",

                    paymentId =
                        existingPendingPayment.PaymentId,

                    status =
                        existingPendingPayment.Status
                });
            }

            // =====================================================
            // BILLING PERIOD
            // =====================================================

            var now =
                DateTime.UtcNow;

            var billingPeriodStart =
                request.BillingPeriodStart
                ?? now;

            var billingPeriodEnd =
                request.BillingPeriodEnd
                ?? CalculateBillingPeriodEnd(
                    subscription.BillingCycle,
                    billingPeriodStart);

            // =====================================================
            // CREATE PAYMENT
            // =====================================================

            var payment =
                new Payment
                {
                    SubscriptionId =
                        subscription.SubscriptionId,

                    Amount =
                        amount,

                    Currency =
                        string.IsNullOrWhiteSpace(
                            subscription.Currency)
                            ? "PHP"
                            : subscription.Currency
                                .Trim()
                                .ToUpperInvariant(),

                    PaymentMethod =
                        paymentMethod,

                    Status =
                        "PENDING",

                    ReferenceNumber =
                        referenceNumber,

                    GatewayPaymentId =
                        Clean(
                            request.GatewayPaymentId),

                    GatewayCheckoutId =
                        Clean(
                            request.GatewayCheckoutId),

                    GatewayCustomerId =
                        Clean(
                            request.GatewayCustomerId),

                    BillingPeriodStart =
                        billingPeriodStart,

                    BillingPeriodEnd =
                        billingPeriodEnd,

                    InvoiceNumber =
                        Clean(
                            request.InvoiceNumber),

                    ReceiptNumber =
                        null,

                    PaidDate =
                        null,

                    FailedDate =
                        null,

                    FailureReason =
                        null,

                    Notes =
                        Clean(
                            request.Notes),

                    CreatedDate =
                        now,

                    UpdatedDate =
                        now
                };

            _context.Payments.Add(
                payment);

            await _context.SaveChangesAsync();

            // =====================================================
            // RESPONSE
            // =====================================================

            return CreatedAtAction(
                nameof(GetPaymentHistory),

                new
                {
                    subscriptionId =
                        subscription.SubscriptionId
                },

                new
                {
                    success = true,

                    message =
                        "Payment submitted successfully and is awaiting verification.",

                    paymentId =
                        payment.PaymentId,

                    subscriptionId =
                        payment.SubscriptionId,

                    churchName =
                        subscription.ChurchName,

                    planName =
                        subscription.SubscriptionPlan != null
                            ? subscription.SubscriptionPlan.PlanName
                            : null,

                    amount =
                        payment.Amount,

                    currency =
                        payment.Currency,

                    paymentMethod =
                        payment.PaymentMethod,

                    status =
                        payment.Status,

                    referenceNumber =
                        payment.ReferenceNumber,

                    billingPeriodStart =
                        payment.BillingPeriodStart,

                    billingPeriodEnd =
                        payment.BillingPeriodEnd,

                    invoiceNumber =
                        payment.InvoiceNumber,

                    receiptNumber =
                        payment.ReceiptNumber,

                    createdDate =
                        payment.CreatedDate
                });
        }

        // =========================================================
        // GET SINGLE PAYMENT
        // GET:
        // api/ClientPayments/{paymentId}
        // =========================================================

        [HttpGet("{paymentId:int}")]
        public async Task<IActionResult> GetPayment(
            int paymentId)
        {
            if (paymentId <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Invalid payment ID."
                });
            }

            var payment =
                await _context.Payments
                    .AsNoTracking()
                    .Where(p =>
                        p.PaymentId == paymentId)
                    .Select(p => new
                    {
                        paymentId =
                            p.PaymentId,

                        subscriptionId =
                            p.SubscriptionId,

                        amount =
                            p.Amount,

                        currency =
                            p.Currency,

                        paymentMethod =
                            p.PaymentMethod,

                        status =
                            p.Status,

                        referenceNumber =
                            p.ReferenceNumber,

                        gatewayPaymentId =
                            p.GatewayPaymentId,

                        gatewayCheckoutId =
                            p.GatewayCheckoutId,

                        gatewayCustomerId =
                            p.GatewayCustomerId,

                        billingPeriodStart =
                            p.BillingPeriodStart,

                        billingPeriodEnd =
                            p.BillingPeriodEnd,

                        invoiceNumber =
                            p.InvoiceNumber,

                        receiptNumber =
                            p.ReceiptNumber,

                        paidDate =
                            p.PaidDate,

                        failedDate =
                            p.FailedDate,

                        failureReason =
                            p.FailureReason,

                        notes =
                            p.Notes,

                        createdDate =
                            p.CreatedDate,

                        updatedDate =
                            p.UpdatedDate
                    })
                    .FirstOrDefaultAsync();

            if (payment == null)
            {
                return NotFound(new
                {
                    success = false,
                    message =
                        "Payment not found."
                });
            }

            return Ok(new
            {
                success = true,
                payment
            });
        }

        // =========================================================
        // HELPERS
        // =========================================================

        private static string? NormalizePaymentMethod(
            string? method)
        {
            if (string.IsNullOrWhiteSpace(method))
            {
                return null;
            }

            var value =
                method.Trim();

            return AllowedPaymentMethods
                .FirstOrDefault(x =>
                    x.Equals(
                        value,
                        StringComparison.OrdinalIgnoreCase));
        }

        private static string? Clean(
            string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }

        private static DateTime
            CalculateBillingPeriodEnd(
                string? billingCycle,
                DateTime startDate)
        {
            if (
                string.Equals(
                    billingCycle,
                    "Annual",
                    StringComparison.OrdinalIgnoreCase)
            )
            {
                return startDate.AddYears(1);
            }

            return startDate.AddMonths(1);
        }
    }

    // =============================================================
    // CLIENT PAYMENT REQUEST
    // =============================================================

    public class ClientPaymentRequest
    {
        public decimal? Amount { get; set; }

        public string PaymentMethod { get; set; }
            = "Manual";

        public string? ReferenceNumber { get; set; }

        public string? GatewayPaymentId { get; set; }

        public string? GatewayCheckoutId { get; set; }

        public string? GatewayCustomerId { get; set; }

        public DateTime? BillingPeriodStart { get; set; }

        public DateTime? BillingPeriodEnd { get; set; }

        public string? InvoiceNumber { get; set; }

        public string? Notes { get; set; }
    }
}