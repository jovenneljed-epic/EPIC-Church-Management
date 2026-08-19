using EPIC.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Services
{
    public class SubscriptionLifecycleService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SubscriptionLifecycleService> _logger;

        public SubscriptionLifecycleService(
            IServiceScopeFactory scopeFactory,
            ILogger<SubscriptionLifecycleService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        // =========================================================
        // PROCESS SUBSCRIPTION LIFECYCLE
        // =========================================================

        public async Task ProcessSubscriptionsAsync()
        {
            using var scope =
                _scopeFactory.CreateScope();

            var context =
                scope.ServiceProvider
                    .GetRequiredService<ApplicationDbContext>();

            var now = DateTime.Now;

            // =====================================================
            // 1. EXPIRE TRIALS
            // =====================================================

            var expiredTrials =
                await context.Subscriptions
                    .Where(s =>
                        s.Status == "TRIAL" &&
                        s.TrialEndsAt.HasValue &&
                        s.TrialEndsAt.Value <= now)
                    .ToListAsync();

            foreach (var subscription in expiredTrials)
            {
                subscription.Status = "EXPIRED";
                subscription.EndDate = now;
                subscription.UpdatedDate = now;

                _logger.LogInformation(
                    "Subscription {SubscriptionId} trial expired.",
                    subscription.SubscriptionId);
            }

            // =====================================================
            // 2. MARK OVERDUE ACTIVE SUBSCRIPTIONS
            // =====================================================

            var overdueSubscriptions =
                await context.Subscriptions
                    .Where(s =>
                        s.Status == "ACTIVE" &&
                        s.NextBillingDate.HasValue &&
                        s.NextBillingDate.Value <= now)
                    .ToListAsync();

            foreach (var subscription in overdueSubscriptions)
            {
                subscription.Status = "PAST_DUE";
                subscription.UpdatedDate = now;

                _logger.LogInformation(
                    "Subscription {SubscriptionId} is now past due.",
                    subscription.SubscriptionId);
            }

            // =====================================================
            // 3. EXPIRE LONG-OVERDUE SUBSCRIPTIONS
            //
            // For now we use 7 days as the grace period.
            // =====================================================

            var gracePeriod =
                now.AddDays(-7);

            var expiredOverdueSubscriptions =
                await context.Subscriptions
                    .Where(s =>
                        s.Status == "PAST_DUE" &&
                        s.NextBillingDate.HasValue &&
                        s.NextBillingDate.Value <= gracePeriod)
                    .ToListAsync();

            foreach (var subscription in expiredOverdueSubscriptions)
            {
                subscription.Status = "EXPIRED";
                subscription.EndDate = now;
                subscription.UpdatedDate = now;

                _logger.LogInformation(
                    "Subscription {SubscriptionId} expired after grace period.",
                    subscription.SubscriptionId);
            }

            // =====================================================
            // SAVE CHANGES
            // =====================================================

            if (expiredTrials.Count > 0 ||
                overdueSubscriptions.Count > 0 ||
                expiredOverdueSubscriptions.Count > 0)
            {
                await context.SaveChangesAsync();
            }

            _logger.LogInformation(
                "Subscription lifecycle processing completed at {Time}.",
                now);
        }
    }
}