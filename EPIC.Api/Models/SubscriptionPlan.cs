using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class SubscriptionPlan
    {
        [Key]
        public int SubscriptionPlanId { get; set; }

        [Required]
        [MaxLength(100)]
        public string PlanName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public decimal MonthlyPrice { get; set; }

        public decimal AnnualPrice { get; set; }

        public int TrialDays { get; set; } = 0;

        public int MaxUsers { get; set; } = 5;

        public int MaxMembers { get; set; } = 500;

        public bool IncludesChurchManagement { get; set; } = true;

        public bool IncludesAttendance { get; set; } = true;

        public bool IncludesGiving { get; set; } = true;

        public bool IncludesFinance { get; set; } = true;

        public bool IncludesMinistries { get; set; } = true;

        public bool IncludesEPICLearning { get; set; } = false;

        public bool IncludesReports { get; set; } = true;

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        public ICollection<Subscription> Subscriptions { get; set; }
            = new List<Subscription>();
    }
}