using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EPIC.Api.Services;

public interface ISmsGatewayService
{
    bool IsConfigured { get; }
    Task<(bool Success, int SentCount, string? Error)> SendSmsAsync(IEnumerable<string> phoneNumbers, string message);
}

public class SemaphoreSmsService : ISmsGatewayService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SemaphoreSmsService> _logger;

    public SemaphoreSmsService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<SemaphoreSmsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured
    {
        get
        {
            var key = _configuration["Semaphore:ApiKey"]?.Trim();
            return !string.IsNullOrWhiteSpace(key) && !key.StartsWith("YOUR_");
        }
    }

    public async Task<(bool Success, int SentCount, string? Error)> SendSmsAsync(IEnumerable<string> phoneNumbers, string message)
    {
        var apiKey = _configuration["Semaphore:ApiKey"]?.Trim();
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.StartsWith("YOUR_"))
        {
            return (false, 0, "No Semaphore API key configured in appsettings.json (Semaphore:ApiKey).");
        }

        var senderName = _configuration["Semaphore:SenderName"]?.Trim();
        var numbersList = phoneNumbers
            .Select(n => n.Trim().Replace(" ", "").Replace("-", ""))
            .Where(n => n.Length >= 7 && !n.StartsWith("0000"))
            .Distinct()
            .ToList();

        if (numbersList.Count == 0)
        {
            return (false, 0, "No valid recipient mobile numbers provided.");
        }

        try
        {
            var client = _httpClientFactory.CreateClient("Semaphore");
            var chunk = string.Join(",", numbersList);
            var formValues = new Dictionary<string, string>
            {
                { "apikey", apiKey },
                { "number", chunk },
                { "message", message }
            };

            if (!string.IsNullOrWhiteSpace(senderName))
            {
                formValues.Add("sendername", senderName);
            }

            var response = await client.PostAsync("https://api.semaphore.co/api/v4/messages", new FormUrlEncodedContent(formValues));
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Semaphore SMS broadcast successfully dispatched to {Count} recipients.", numbersList.Count);
                return (true, numbersList.Count, null);
            }

            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Semaphore SMS gateway responded with failure: {Status} - {Body}", response.StatusCode, errorContent);
            return (false, 0, $"Semaphore Gateway error ({response.StatusCode}): {errorContent}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while sending SMS via Semaphore.");
            return (false, 0, ex.Message);
        }
    }
}
