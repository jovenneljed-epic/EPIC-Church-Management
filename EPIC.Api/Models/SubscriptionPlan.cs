using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class SubscriptionPlan
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int SubscriptionPlanId { get; set; }

        // =========================================================
        // PLAN INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string PlanName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        // =========================================================
        // PRICING
        // =========================================================

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AnnualPrice { get; set; }

        // =========================================================
        // TRIAL & LIMITS
        // =========================================================

        public int TrialDays { get; set; }

        public int MaxUsers { get; set; } = 5;

        public int MaxMembers { get; set; } = 500;

        // =========================================================
        // FEATURES
        // =========================================================

        public bool IncludesChurchManagement { get; set; } = true;

        public bool IncludesAttendance { get; set; } = true;

        public bool IncludesGiving { get; set; } = true;

        public bool IncludesFinance { get; set; } = true;

        public bool IncludesMinistries { get; set; } = true;

        public bool IncludesEPICLearning { get; set; }

        public bool IncludesReports { get; set; } = true;

        // =========================================================
        // STATUS & DISPLAY
        // =========================================================

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        // =========================================================
        // NAVIGATION
        // =========================================================

        public virtual ICollection<Subscription> Subscriptions { get; set; }
            = new List<Subscription>();
    }
}