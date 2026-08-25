using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Subscription
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int SubscriptionId { get; set; }

        // =========================================================
        // CUSTOMER
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        public virtual Customer? Customer { get; set; }

        // =========================================================
        // SUBSCRIBER / CHURCH INFORMATION
        // =========================================================

        [Required]
        [MaxLength(200)]
        public string ChurchName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string ContactName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(200)]
        public string ContactEmail { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ContactPhone { get; set; } = string.Empty;

        // =========================================================
        // SUBSCRIPTION PLAN
        // =========================================================

        [Required]
        public int SubscriptionPlanId { get; set; }

        public virtual SubscriptionPlan? SubscriptionPlan { get; set; }

        // =========================================================
        // BILLING
        // =========================================================

        [Required]
        [MaxLength(20)]
        public string BillingCycle { get; set; } = "Monthly";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(10)]
        public string Currency { get; set; } = "PHP";

        // =========================================================
        // SUBSCRIPTION STATUS
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "TRIAL";

        // TRIAL
        // ACTIVE
        // PAST_DUE
        // SUSPENDED
        // EXPIRED
        // CANCELLED

        // =========================================================
        // SUBSCRIPTION DATES
        // =========================================================

        public DateTime StartDate { get; set; } = DateTime.Now;

        public DateTime? TrialEndsAt { get; set; }

        public DateTime? EndDate { get; set; }

        public DateTime? NextBillingDate { get; set; }

        public DateTime? CancelledDate { get; set; }

        // =========================================================
        // PAYMENT GATEWAY REFERENCES
        // =========================================================

        [MaxLength(200)]
        public string? PaymentCustomerId { get; set; }

        [MaxLength(200)]
        public string? PaymentSubscriptionId { get; set; }

        // =========================================================
        // NOTES
        // =========================================================

        [MaxLength(2000)]
        public string? Notes { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        // =========================================================
        // NAVIGATION
        // =========================================================

        public virtual ICollection<Payment> Payments { get; set; }
            = new List<Payment>();
    }
}