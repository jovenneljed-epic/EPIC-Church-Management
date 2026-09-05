using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Controllers;

[ApiController]
[Route("api/PublicCheckout")]
[AllowAnonymous]
public class PublicCheckoutController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ResendEmailService _email;

    private static readonly Dictionary<string, string> PlanAliases =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["starter"] = "EPIC Starter",
            ["growth"] = "EPIC Growth",
            ["complete"] = "EPIC Complete"
        };

    public PublicCheckoutController(ApplicationDbContext context, ResendEmailService email)
    {
        _context = context;
        _email = email;
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PublicSubscribeRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ChurchName) ||
            string.IsNullOrWhiteSpace(request.ContactPerson) ||
            string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(new { message = "Church name, contact person, email, and phone are required." });

        if (!new EmailAddressAttribute().IsValid(request.Email.Trim()))
            return BadRequest(new { message = "Please provide a valid email address." });

        var cycle = request.BillingCycle?.Trim().Equals("yearly", StringComparison.OrdinalIgnoreCase) == true
            || request.BillingCycle?.Trim().Equals("annual", StringComparison.OrdinalIgnoreCase) == true
            ? "Annual" : "Monthly";

        if (!PlanAliases.TryGetValue(request.PlanId?.Trim() ?? "", out var planName))
            return BadRequest(new { message = "Invalid subscription plan." });

        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p =>
            p.IsActive && p.PlanName.ToLower() == planName.ToLower());
        if (plan == null)
            return BadRequest(new { message = $"The {planName} plan is not configured in the subscription database." });

        var email = request.Email.Trim();
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email.ToLower() == email.ToLower());

        await using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            if (customer == null)
            {
                customer = new Customer
                {
                    ChurchName = request.ChurchName.Trim(),
                    ContactPerson = request.ContactPerson.Trim(),
                    Email = email,
                    Phone = request.Phone.Trim(),
                    Status = "Active",
                    CreatedDate = DateTime.UtcNow
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
            }
            else
            {
                customer.ChurchName = request.ChurchName.Trim();
                customer.ContactPerson = request.ContactPerson.Trim();
                customer.Phone = request.Phone.Trim();
                customer.UpdatedDate = DateTime.UtcNow;
            }

            var blocking = await _context.Subscriptions.AnyAsync(s =>
                s.CustomerId == customer.CustomerId &&
                new[] { "PENDING_PAYMENT", "TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED" }.Contains(s.Status));
            if (blocking)
                return Conflict(new { message = "This email already has an active or pending EPIC subscription." });

            var now = DateTime.UtcNow;
            var amount = cycle == "Annual" ? plan.AnnualPrice : plan.MonthlyPrice;
            var subscription = new Subscription
            {
                CustomerId = customer.CustomerId,
                ChurchName = customer.ChurchName,
                ContactName = customer.ContactPerson,
                ContactEmail = customer.Email,
                ContactPhone = customer.Phone ?? "",
                SubscriptionPlanId = plan.SubscriptionPlanId,
                BillingCycle = cycle,
                Amount = amount,
                Currency = "PHP",
                Status = "PENDING_PAYMENT",
                StartDate = now,
                NextBillingDate = null,
                CreatedDate = now,
                UpdatedDate = now
            };
            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            await tx.CommitAsync();

            await _email.SendSubscriptionCreatedAsync(
                subscription.ContactEmail, subscription.ContactName, subscription.ChurchName,
                plan.PlanName, subscription.BillingCycle, subscription.Amount,
                subscription.SubscriptionId, subscription.Status);

            await _email.SendNewSubscriptionAdminNotificationAsync(
                subscription.ChurchName, subscription.ContactName, subscription.ContactEmail,
                subscription.ContactPhone, plan.PlanName, subscription.BillingCycle,
                subscription.Amount, subscription.SubscriptionId);

            return Ok(new
            {
                success = true,
                subscriptionId = subscription.SubscriptionId,
                customerId = customer.CustomerId,
                planName = plan.PlanName,
                billingCycle = subscription.BillingCycle,
                amount = subscription.Amount,
                currency = subscription.Currency,
                status = subscription.Status
            });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    [HttpPost("payment")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> SubmitPayment([FromForm] PublicPaymentRequest request)
    {
        if (request.SubscriptionId <= 0 || request.Proof == null || request.Proof.Length == 0 ||
            string.IsNullOrWhiteSpace(request.ReferenceNumber))
            return BadRequest(new { message = "Subscription, payment reference, and payment proof are required." });

        if (request.Proof.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Payment proof must be 5 MB or smaller." });

        var allowed = new[] { "image/png", "image/jpeg", "image/webp", "application/pdf" };
        if (!allowed.Contains(request.Proof.ContentType, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Payment proof must be PNG, JPG, WEBP, or PDF." });

        var subscription = await _context.Subscriptions
            .Include(s => s.SubscriptionPlan)
            .FirstOrDefaultAsync(s => s.SubscriptionId == request.SubscriptionId);
        if (subscription == null)
            return NotFound(new { message = "Subscription not found." });
        if (subscription.Status != "PENDING_PAYMENT")
            return BadRequest(new { message = "This subscription is not awaiting payment." });

        var reference = request.ReferenceNumber.Trim();
        var duplicate = await _context.Payments.AnyAsync(p => p.ReferenceNumber == reference);
        if (duplicate)
            return Conflict(new { message = "This payment reference has already been submitted." });

        await using var stream = new MemoryStream();
        await request.Proof.CopyToAsync(stream);
        var now = DateTime.UtcNow;
        var payment = new Payment
        {
            SubscriptionId = subscription.SubscriptionId,
            Amount = subscription.Amount,
            Currency = subscription.Currency,
            PaymentMethod = request.PaymentMethod?.Equals("gotyme", StringComparison.OrdinalIgnoreCase) == true ? "GoTyme" : "GCash",
            Status = "PENDING",
            ReferenceNumber = reference,
            PaymentProofFileName = Path.GetFileName(request.Proof.FileName),
            PaymentProofContentType = request.Proof.ContentType,
            PaymentProofData = stream.ToArray(),
            PaymentProofUploadedDate = now,
            BillingPeriodStart = now,
            BillingPeriodEnd = subscription.BillingCycle.Equals("Annual", StringComparison.OrdinalIgnoreCase) ? now.AddYears(1) : now.AddMonths(1),
            CreatedDate = now,
            UpdatedDate = now,
            Notes = "Submitted through public checkout."
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var planName = subscription.SubscriptionPlan?.PlanName ?? "EPIC Subscription";
        await _email.SendPaymentSubmittedAsync(
            subscription.ContactEmail, subscription.ContactName, subscription.ChurchName,
            planName, payment.Amount, payment.Currency, payment.PaymentId,
            subscription.SubscriptionId, payment.PaymentMethod, payment.ReferenceNumber);

        await _email.SendNewPaymentAdminNotificationAsync(
            payment.PaymentId, subscription.SubscriptionId, subscription.ChurchName, planName,
            payment.Amount, payment.Currency, payment.PaymentMethod, payment.ReferenceNumber);

        return Ok(new { success = true, paymentId = payment.PaymentId, subscriptionId = subscription.SubscriptionId, status = payment.Status });
    }
}

public class PublicSubscribeRequest
{
    [Required] public string ChurchName { get; set; } = "";
    [Required] public string ContactPerson { get; set; } = "";
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required] public string Phone { get; set; } = "";
    [Required] public string PlanId { get; set; } = "";
    [Required] public string BillingCycle { get; set; } = "monthly";
}

public class PublicPaymentRequest
{
    [Required] public int SubscriptionId { get; set; }
    [Required] public string ReferenceNumber { get; set; } = "";
    public string PaymentMethod { get; set; } = "gcash";
    [Required] public IFormFile? Proof { get; set; }
}
