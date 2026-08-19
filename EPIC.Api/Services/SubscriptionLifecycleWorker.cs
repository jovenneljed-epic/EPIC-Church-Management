namespace EPIC.Api.Services
{
    public class SubscriptionLifecycleWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SubscriptionLifecycleWorker> _logger;

        public SubscriptionLifecycleWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<SubscriptionLifecycleWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "EPIC Subscription Lifecycle Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope =
                        _scopeFactory.CreateScope();

                    var lifecycleService =
                        scope.ServiceProvider
                            .GetRequiredService<
                                SubscriptionLifecycleService>();

                    await lifecycleService
                        .ProcessSubscriptionsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Error while processing subscription lifecycle.");
                }

                // =================================================
                // RUN EVERY 1 HOUR
                // =================================================

                await Task.Delay(
                    TimeSpan.FromHours(1),
                    stoppingToken);
            }

            _logger.LogInformation(
                "EPIC Subscription Lifecycle Worker stopped.");
        }
    }
}