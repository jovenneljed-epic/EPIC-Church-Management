using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models.WebsiteAnalytics
{
    public class WebsiteVisitCreateDto
    {
        // =========================================================
        // VISITOR / SESSION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string VisitorId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string SessionId { get; set; } = string.Empty;

        // =========================================================
        // PAGE
        // =========================================================

        [Required]
        [MaxLength(500)]
        public string PageUrl { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? PagePath { get; set; }

        [MaxLength(200)]
        public string? PageTitle { get; set; }

        [MaxLength(500)]
        public string? LandingPage { get; set; }

        // =========================================================
        // TRAFFIC
        // =========================================================

        [MaxLength(1000)]
        public string? Referrer { get; set; }

        [MaxLength(100)]
        public string? TrafficSource { get; set; }

        [MaxLength(100)]
        public string? TrafficMedium { get; set; }

        [MaxLength(200)]
        public string? TrafficCampaign { get; set; }

        // =========================================================
        // UTM
        // =========================================================

        [MaxLength(200)]
        public string? UtmSource { get; set; }

        [MaxLength(200)]
        public string? UtmMedium { get; set; }

        [MaxLength(200)]
        public string? UtmCampaign { get; set; }

        [MaxLength(200)]
        public string? UtmTerm { get; set; }

        [MaxLength(200)]
        public string? UtmContent { get; set; }

        // =========================================================
        // DEVICE
        // =========================================================

        [MaxLength(50)]
        public string? DeviceType { get; set; }

        [MaxLength(100)]
        public string? Browser { get; set; }

        [MaxLength(100)]
        public string? OperatingSystem { get; set; }

        [MaxLength(50)]
        public string? ScreenResolution { get; set; }

        // =========================================================
        // LOCATION
        // =========================================================

        [MaxLength(100)]
        public string? Country { get; set; }

        [MaxLength(100)]
        public string? Region { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        // =========================================================
        // ENGAGEMENT
        // =========================================================

        public int? TimeOnPageSeconds { get; set; }

        public bool IsBounce { get; set; } = true;

        public bool IsReturningVisitor { get; set; }

        // =========================================================
        // DATE / TIME
        // =========================================================

        public DateTime? VisitedAt { get; set; }

        public DateTime? LastActivityAt { get; set; }

        // =========================================================
        // TECHNICAL
        // =========================================================

        [MaxLength(1000)]
        public string? UserAgent { get; set; }

        [MaxLength(100)]
        public string? Language { get; set; }

        [MaxLength(50)]
        public string? TimeZone { get; set; }
    }
}