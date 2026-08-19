using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN")]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

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
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
        {
            var payments = await _context.Payments
                .AsNoTracking()
                .Include(p => p.Subscription)
                    .ThenInclude(s => s!.SubscriptionPlan)
                .OrderByDescending(p => p.CreatedDate)
                .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // GET PAYMENT BY ID
        // GET: api/Payments/5
        // =========================================================

        [HttpGet("{id:int}")]
        [Permission("Payments", "view")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid payment ID."
                });
            }

            var payment = await _context.Payments
                .AsNoTracking()
                .Include(p => p.Subscription)
                    .ThenInclude(s => s!.SubscriptionPlan)
                .FirstOrDefaultAsync(p =>
                    p.PaymentId == id);

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
        // GET: api/Payments/subscription/5
        // =========================================================

        [HttpGet("subscription/{subscriptionId:int}")]
        [Permission("Payments", "view")]
        public async Task<ActionResult<IEnumerable<Payment>>>
            GetPaymentsBySubscription(int subscriptionId)
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
                    .AnyAsync(s =>
                        s.SubscriptionId == subscriptionId);

            if (!subscriptionExists)
            {
                return NotFound(new
                {
                    message = "Subscription not found."
                });
            }

            var payments = await _context.Payments
                .AsNoTracking()
                .Where(p =>
                    p.SubscriptionId == subscriptionId)
                .OrderByDescending(p =>
                    p.CreatedDate)
                .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // GET PAYMENTS BY STATUS
        // GET: api/Payments/status/PAID
        // =========================================================

        [HttpGet("status/{status}")]
        [Permission("Payments", "view")]
        public async Task<ActionResult<IEnumerable<Payment>>>
            GetPaymentsByStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return BadRequest(new
                {
                    message = "Payment status is required."
                });
            }

            var normalizedStatus =
                status.Trim().ToUpperInvariant();

            var allowedStatuses = new[]
            {
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED",
                "CANCELLED"
            };

            if (!allowedStatuses.Contains(normalizedStatus))
            {
                return BadRequest(new
                {
                    message = "Invalid payment status."
                });
            }

            var payments = await _context.Payments
                .AsNoTracking()
                .Include(p => p.Subscription)
                    .ThenInclude(s => s!.SubscriptionPlan)
                .Where(p =>
                    p.Status == normalizedStatus)
                .OrderByDescending(p =>
                    p.CreatedDate)
                .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // CREATE PAYMENT
        // POST: api/Payments
        // =========================================================

        [HttpPost]
        [Permission("Payments", "create")]
        public async Task<ActionResult<Payment>> CreatePayment(
            [FromBody] Payment request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (request.SubscriptionId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid subscription is required."
                });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message = "Payment amount must be greater than zero."
                });
            }

            // -----------------------------------------------------
            // Validate subscription
            // -----------------------------------------------------

            var subscription =
                await _context.Subscriptions
                    .Include(s => s.SubscriptionPlan)
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId ==
                        request.SubscriptionId);

            if (subscription == null)
            {
                return BadRequest(new
                {
                    message = "Subscription not found."
                });
            }

            // -----------------------------------------------------
            // Validate payment method
            // -----------------------------------------------------

            var paymentMethod =
                string.IsNullOrWhiteSpace(request.PaymentMethod)
                    ? "Manual"
                    : request.PaymentMethod.Trim();

            // -----------------------------------------------------
            // Validate status
            // -----------------------------------------------------

            var status =
                string.IsNullOrWhiteSpace(request.Status)
                    ? "PENDING"
                    : request.Status.Trim().ToUpperInvariant();

            var allowedStatuses = new[]
            {
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED",
                "CANCELLED"
            };

            if (!allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message = "Invalid payment status."
                });
            }

            // -----------------------------------------------------
            // Create payment
            // -----------------------------------------------------

            var now = DateTime.Now;

            var payment = new Payment
            {
                SubscriptionId =
                    subscription.SubscriptionId,

                Amount =
                    request.Amount,

                Currency =
                    string.IsNullOrWhiteSpace(request.Currency)
                        ? "PHP"
                        : request.Currency
                            .Trim()
                            .ToUpperInvariant(),

                PaymentMethod =
                    paymentMethod,

                Status =
                    status,

                ReferenceNumber =
                    request.ReferenceNumber?.Trim(),

                GatewayPaymentId =
                    request.GatewayPaymentId?.Trim(),

                GatewayCheckoutId =
                    request.GatewayCheckoutId?.Trim(),

                GatewayCustomerId =
                    request.GatewayCustomerId?.Trim(),

                InvoiceNumber =
                    request.InvoiceNumber?.Trim(),

                ReceiptNumber =
                    request.ReceiptNumber?.Trim(),

                FailureReason =
                    request.FailureReason?.Trim(),

                Notes =
                    request.Notes?.Trim(),

                CreatedDate =
                    now
            };

            _context.Payments.Add(payment);

            // -----------------------------------------------------
            // If payment is already PAID, update subscription
            // -----------------------------------------------------

            if (status == "PAID")
            {
                subscription.Status = "ACTIVE";
                subscription.UpdatedDate = now;

                subscription.CancelledDate = null;
                subscription.EndDate = null;

                subscription.NextBillingDate =
                    subscription.BillingCycle.Equals(
                        "Annual",
                        StringComparison.OrdinalIgnoreCase)
                        ? now.AddYears(1)
                        : now.AddMonths(1);
            }

            await _context.SaveChangesAsync();

            // -----------------------------------------------------
            // Reload navigation
            // -----------------------------------------------------

            await _context.Entry(payment)
                .Reference(p => p.Subscription)
                .LoadAsync();

            return CreatedAtAction(
                nameof(GetPayment),
                new
                {
                    id = payment.PaymentId
                },
                payment);
        }

        // =========================================================
        // UPDATE PAYMENT
        // PUT: api/Payments/5
        // =========================================================

        [HttpPut("{id:int}")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> UpdatePayment(
            int id,
            [FromBody] Payment request)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid payment ID."
                });
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
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

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Payment amount must be greater than zero."
                });
            }

            // -----------------------------------------------------
            // Validate subscription
            // -----------------------------------------------------

            var subscription =
                await _context.Subscriptions
                    .FirstOrDefaultAsync(s =>
                        s.SubscriptionId ==
                        request.SubscriptionId);

            if (subscription == null)
            {
                return BadRequest(new
                {
                    message = "Subscription not found."
                });
            }

            // -----------------------------------------------------
            // Validate status
            // -----------------------------------------------------

            var status =
                string.IsNullOrWhiteSpace(request.Status)
                    ? payment.Status
                    : request.Status
                        .Trim()
                        .ToUpperInvariant();

            var allowedStatuses = new[]
            {
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED",
                "CANCELLED"
            };

            if (!allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message = "Invalid payment status."
                });
            }

            // -----------------------------------------------------
            // Update payment
            // -----------------------------------------------------

            payment.SubscriptionId =
                subscription.SubscriptionId;

            payment.Amount =
                request.Amount;

            payment.Currency =
                string.IsNullOrWhiteSpace(request.Currency)
                    ? "PHP"
                    : request.Currency
                        .Trim()
                        .ToUpperInvariant();

            payment.PaymentMethod =
                string.IsNullOrWhiteSpace(request.PaymentMethod)
                    ? payment.PaymentMethod
                    : request.PaymentMethod.Trim();

            payment.Status =
                status;

            payment.ReferenceNumber =
                request.ReferenceNumber?.Trim();

            payment.GatewayPaymentId =
                request.GatewayPaymentId?.Trim();

            payment.GatewayCheckoutId =
                request.GatewayCheckoutId?.Trim();

            payment.GatewayCustomerId =
                request.GatewayCustomerId?.Trim();

            payment.InvoiceNumber =
                request.InvoiceNumber?.Trim();

            payment.ReceiptNumber =
                request.ReceiptNumber?.Trim();

            payment.FailureReason =
                request.FailureReason?.Trim();

            payment.Notes =
                request.Notes?.Trim();

            // -----------------------------------------------------
            // Synchronize subscription
            // -----------------------------------------------------

            var now = DateTime.Now;

            if (status == "PAID")
            {
                subscription.Status = "ACTIVE";
                subscription.CancelledDate = null;
                subscription.EndDate = null;
                subscription.UpdatedDate = now;

                subscription.NextBillingDate =
                    subscription.BillingCycle.Equals(
                        "Annual",
                        StringComparison.OrdinalIgnoreCase)
                        ? now.AddYears(1)
                        : now.AddMonths(1);
            }

            if (status == "FAILED")
            {
                subscription.Status = "PAST_DUE";
                subscription.UpdatedDate = now;
            }

            if (status == "CANCELLED")
            {
                subscription.Status = "CANCELLED";
                subscription.CancelledDate = now;
                subscription.EndDate = now;
                subscription.UpdatedDate = now;
            }

            await _context.SaveChangesAsync();

            await _context.Entry(payment)
                .Reference(p => p.Subscription)
                .LoadAsync();

            return Ok(payment);
        }

        // =========================================================
        // MARK PAYMENT AS PAID
        // POST: api/Payments/5/mark-paid
        // =========================================================

        [HttpPost("{id:int}/mark-paid")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
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

            if (payment.Status == "PAID")
            {
                return BadRequest(new
                {
                    message = "Payment is already marked as paid."
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

            var now = DateTime.Now;

            payment.Status = "PAID";

            subscription.Status = "ACTIVE";
            subscription.CancelledDate = null;
            subscription.EndDate = null;
            subscription.UpdatedDate = now;

            subscription.NextBillingDate =
                subscription.BillingCycle.Equals(
                    "Annual",
                    StringComparison.OrdinalIgnoreCase)
                    ? now.AddYears(1)
                    : now.AddMonths(1);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment marked as paid successfully.",
                paymentId = payment.PaymentId,
                status = payment.Status,
                subscriptionId = subscription.SubscriptionId,
                subscriptionStatus = subscription.Status,
                nextBillingDate = subscription.NextBillingDate
            });
        }

        // =========================================================
        // MARK PAYMENT AS FAILED
        // POST: api/Payments/5/mark-failed
        // =========================================================

        [HttpPost("{id:int}/mark-failed")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> MarkAsFailed(int id)
        {
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

            var now = DateTime.Now;

            payment.Status = "FAILED";

            subscription.Status = "PAST_DUE";
            subscription.UpdatedDate = now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment marked as failed.",
                paymentId = payment.PaymentId,
                status = payment.Status,
                subscriptionId = subscription.SubscriptionId,
                subscriptionStatus = subscription.Status
            });
        }

        // =========================================================
        // REFUND PAYMENT
        // POST: api/Payments/5/refund
        // =========================================================

        [HttpPost("{id:int}/refund")]
        [Permission("Payments", "edit")]
        public async Task<IActionResult> RefundPayment(int id)
        {
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

            var now = DateTime.Now;

            payment.Status = "REFUNDED";

            subscription.Status = "PAST_DUE";
            subscription.UpdatedDate = now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment refunded successfully.",
                paymentId = payment.PaymentId,
                status = payment.Status,
                subscriptionId = subscription.SubscriptionId,
                subscriptionStatus = subscription.Status
            });
        }

        // =========================================================
        // DELETE PAYMENT
        // DELETE: api/Payments/5
        // =========================================================

        [HttpDelete("{id:int}")]
        [Permission("Payments", "delete")]
        public async Task<IActionResult> DeletePayment(int id)
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

            // -----------------------------------------------------
            // Do not delete completed payments
            // -----------------------------------------------------

            if (payment.Status == "PAID")
            {
                return BadRequest(new
                {
                    message =
                        "Completed payments cannot be deleted."
                });
            }

            _context.Payments.Remove(payment);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}