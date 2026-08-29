using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventChecklist
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int EventChecklistId { get; set; }

        // =========================================================
        // EVENT
        // =========================================================

        [Required]
        public int EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public virtual Event? Event { get; set; }

        // =========================================================
        // CHECKLIST ITEM
        // =========================================================

        [Required]
        [MaxLength(300)]
        public string TaskName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        // =========================================================
        // CHECKLIST CATEGORY
        // =========================================================

        [MaxLength(100)]
        public string? Category { get; set; }

        // =========================================================
        // ASSIGNMENT
        // =========================================================

        public int? AssignedMemberId { get; set; }

        [ForeignKey(nameof(AssignedMemberId))]
        public virtual Member? AssignedMember { get; set; }

        [MaxLength(200)]
        public string? AssignedPerson { get; set; }

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "PENDING";

        // PENDING
        // IN_PROGRESS
        // COMPLETED
        // SKIPPED

        // =========================================================
        // PRIORITY
        // =========================================================

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "NORMAL";

        // LOW
        // NORMAL
        // HIGH
        // URGENT

        // =========================================================
        // ORDER
        // =========================================================

        public int SortOrder { get; set; } = 0;

        // =========================================================
        // DUE DATE
        // =========================================================

        public DateTime? DueDate { get; set; }

        // =========================================================
        // COMPLETION
        // =========================================================

        public DateTime? CompletedAt { get; set; }

        public int? CompletedByMemberId { get; set; }

        [ForeignKey(nameof(CompletedByMemberId))]
        public virtual Member? CompletedByMember { get; set; }

        // =========================================================
        // NOTES
        // =========================================================

        public string? Notes { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}