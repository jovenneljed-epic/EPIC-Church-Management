using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class MinistryPerformanceRating
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int PerformanceRatingId { get; set; }

        // =========================================================
        // MINISTRY ASSIGNMENT
        // =========================================================

        [Required]
        public int MinistryMemberId { get; set; }

        [ForeignKey(nameof(MinistryMemberId))]
        public virtual MinistryMember? MinistryMember { get; set; }

        // =========================================================
        // EVALUATION DATE
        // =========================================================

        [Required]
        public DateTime EvaluationDate { get; set; } = DateTime.Now;

        // =========================================================
        // PERFORMANCE RATINGS
        // =========================================================
        //
        // 1 = Unsatisfactory
        // 2 = Needs Improvement
        // 3 = Satisfactory
        // 4 = Very Good
        // 5 = Excellent
        //
        // =========================================================

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal AttendanceRating { get; set; }

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal CommitmentRating { get; set; }

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal ParticipationRating { get; set; }

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal TeamworkRating { get; set; }

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal SpiritualGrowthRating { get; set; }

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal LeadershipRating { get; set; }

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal ResponsibilityRating { get; set; }

        // =========================================================
        // OVERALL RATING
        // =========================================================

        [Range(1, 5)]
        [Column(TypeName = "decimal(3,2)")]
        public decimal OverallRating { get; set; }

        // =========================================================
        // EVALUATION COMMENTS
        // =========================================================

        [MaxLength(2000)]
        public string Strengths { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string AreasForImprovement { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Recommendations { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Evaluator { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Notes { get; set; } = string.Empty;

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}