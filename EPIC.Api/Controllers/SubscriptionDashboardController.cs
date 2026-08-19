using EPIC.Api.Authorization;
using EPIC.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN")]
    public class SubscriptionDashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionDashboardController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET SUBSCRIPTION DASHBOARD
        //
        // GET:
        // api/SubscriptionDashboard
        // =========================================================

        [HttpGet]
        [Permission("Subscriptions", "view")]
        public async Task<IActionResult> GetDashboard()
        {
            // =====================================================
            // SUBSCRIPTION COUNTS
            // =====================================================

            var totalSubscriptions =
                await _context.Subscriptions
                    .CountAsync();

            var activeSubscriptions =
                await _context.Subscriptions
                    .CountAsync(s =>
                        s.Status == "ACTIVE");

            var trialSubscriptions =
                await _context.Subscriptions
                    .CountAsync(s =>
                        s.Status == "TRIAL");

            var pastDueSubscriptions =
                await _context.Subscriptions
                    .CountAsync(s =>
                        s.Status == "PAST_DUE");

            var expiredSubscriptions =
                await _context.Subscriptions
                    .CountAsync(s =>
                        s.Status == "EXPIRED");

            var cancelledSubscriptions =
                await _context.Subscriptions
                    .CountAsync(s =>
                        s.Status == "CANCELLED");

            // =====================================================
            // PAYMENT COUNTS
            // =====================================================

            var totalPayments =
                await _context.Payments
                    .CountAsync();

            var paidPayments =
                await _context.Payments
                    .CountAsync(p =>
                        p.Status == "PAID");

            var pendingPayments =
                await _context.Payments
                    .CountAsync(p =>
                        p.Status == "PENDING");

            var failedPayments =
                await _context.Payments
                    .CountAsync(p =>
                        p.Status == "FAILED");

            var refundedPayments =
                await _context.Payments
                    .CountAsync(p =>
                        p.Status == "REFUNDED");

            // =====================================================
            // REVENUE
            // =====================================================

            var totalRevenue =
                await _context.Payments
                    .Where(p =>
                        p.Status == "PAID")
                    .SumAsync(p =>
                        (decimal?)p.Amount) ?? 0m;

            // =====================================================
            // CURRENT MONTH REVENUE
            // =====================================================

            var now = DateTime.Now;

            var monthStart =
                new DateTime(
                    now.Year,
                    now.Month,
                    1);

            var monthEnd =
                monthStart.AddMonths(1);

            var monthlyRevenue =
                await _context.Payments
                    .Where(p =>
                        p.Status == "PAID" &&
                        p.CreatedDate >= monthStart &&
                        p.CreatedDate < monthEnd)
                    .SumAsync(p =>
                        (decimal?)p.Amount) ?? 0m;

            // =====================================================
            // UPCOMING BILLING
            // =====================================================

            var upcomingBilling =
                await _context.Subscriptions
                    .CountAsync(s =>
                        s.Status == "ACTIVE" &&
                        s.NextBillingDate.HasValue &&
                        s.NextBillingDate.Value >= now &&
                        s.NextBillingDate.Value <= now.AddDays(30));

            // =====================================================
            // TRIALS EXPIRING SOON
            // =====================================================

            var trialsExpiringSoon =
                await _context.Subscriptions
                    .CountAsync(s =>
                        s.Status == "TRIAL" &&
                        s.TrialEndsAt.HasValue &&
                        s.TrialEndsAt.Value >= now &&
                        s.TrialEndsAt.Value <= now.AddDays(7));

            // =====================================================
            // RETURN DASHBOARD
            // =====================================================

            return Ok(new
            {
                generatedAt = now,

                subscriptions = new
                {
                    total = totalSubscriptions,
                    active = activeSubscriptions,
                    trial = trialSubscriptions,
                    pastDue = pastDueSubscriptions,
                    expired = expiredSubscriptions,
                    cancelled = cancelledSubscriptions
                },

                payments = new
                {
                    total = totalPayments,
                    paid = paidPayments,
                    pending = pendingPayments,
                    failed = failedPayments,
                    refunded = refundedPayments
                },

                revenue = new
                {
                    total = totalRevenue,
                    currentMonth = monthlyRevenue
                },

                upcoming = new
                {
                    billingNext30Days = upcomingBilling,
                    trialsExpiringNext7Days = trialsExpiringSoon
                }
            });
        }

        // =========================================================
        // GET RECENT PAYMENTS
        //
        // GET:
        // api/SubscriptionDashboard/recent-payments
        // =========================================================

        [HttpGet("recent-payments")]
        [Permission("Subscriptions", "view")]
        public async Task<IActionResult> GetRecentPayments()
        {
            var payments =
                await _context.Payments
                    .AsNoTracking()
                    .Include(p => p.Subscription)
                    .ThenInclude(s => s!.SubscriptionPlan)
                    .OrderByDescending(p =>
                        p.CreatedDate)
                    .Take(10)
                    .Select(p => new
                    {
                        paymentId =
                            p.PaymentId,

                        subscriptionId =
                            p.SubscriptionId,

                        churchName =
                            p.Subscription != null
                                ? p.Subscription.ChurchName
                                : null,

                        planName =
                            p.Subscription != null &&
                            p.Subscription.SubscriptionPlan != null
                                ? p.Subscription
                                    .SubscriptionPlan
                                    .PlanName
                                : null,

                        amount =
                            p.Amount,

                        currency =
                            p.Currency,

                        status =
                            p.Status,

                        paymentMethod =
                            p.PaymentMethod,

                        referenceNumber =
                            p.ReferenceNumber,

                        createdDate =
                            p.CreatedDate
                    })
                    .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // GET EXPIRING TRIALS
        //
        // GET:
        // api/SubscriptionDashboard/expiring-trials
        // =========================================================

        [HttpGet("expiring-trials")]
        [Permission("Subscriptions", "view")]
        public async Task<IActionResult> GetExpiringTrials()
        {
            var now = DateTime.Now;

            var trials =
                await _context.Subscriptions
                    .AsNoTracking()
                    .Include(s =>
                        s.SubscriptionPlan)
                    .Where(s =>
                        s.Status == "TRIAL" &&
                        s.TrialEndsAt.HasValue &&
                        s.TrialEndsAt.Value >= now &&
                        s.TrialEndsAt.Value <= now.AddDays(7))
                    .OrderBy(s =>
                        s.TrialEndsAt)
                    .Select(s => new
                    {
                        subscriptionId =
                            s.SubscriptionId,

                        churchName =
                            s.ChurchName,

                        contactName =
                            s.ContactName,

                        contactEmail =
                            s.ContactEmail,

                        planName =
                            s.SubscriptionPlan != null
                                ? s.SubscriptionPlan.PlanName
                                : null,

                        trialEndsAt =
                            s.TrialEndsAt,

                        daysRemaining =
                            s.TrialEndsAt.HasValue
                                ? EF.Functions.DateDiffDay(
                                    now,
                                    s.TrialEndsAt.Value)
                                : 0
                    })
                    .ToListAsync();

            return Ok(trials);
        }

        // =========================================================
        // GET PAST DUE SUBSCRIPTIONS
        //
        // GET:
        // api/SubscriptionDashboard/past-due
        // =========================================================

        [HttpGet("past-due")]
        [Permission("Subscriptions", "view")]
        public async Task<IActionResult> GetPastDueSubscriptions()
        {
            var subscriptions =
                await _context.Subscriptions
                    .AsNoTracking()
                    .Include(s =>
                        s.SubscriptionPlan)
                    .Where(s =>
                        s.Status == "PAST_DUE")
                    .OrderBy(s =>
                        s.NextBillingDate)
                    .Select(s => new
                    {
                        subscriptionId =
                            s.SubscriptionId,

                        churchName =
                            s.ChurchName,

                        contactName =
                            s.ContactName,

                        contactEmail =
                            s.ContactEmail,

                        planName =
                            s.SubscriptionPlan != null
                                ? s.SubscriptionPlan.PlanName
                                : null,

                        amount =
                            s.Amount,

                        currency =
                            s.Currency,

                        nextBillingDate =
                            s.NextBillingDate,

                        status =
                            s.Status
                    })
                    .ToListAsync();

            return Ok(subscriptions);
        }
    }
}