using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventNeed
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int EventNeedId { get; set; }

        // =========================================================
        // EVENT
        // =========================================================

        [Required]
        public int EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public virtual Event? Event { get; set; }

        // =========================================================
        // NEED INFORMATION
        // =========================================================

        [Required]
        [MaxLength(200)]
        public string NeedName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        // =========================================================
        // QUANTITY
        // =========================================================

        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; } = 1m;

        [MaxLength(50)]
        public string? Unit { get; set; }

        // =========================================================
        // RESPONSIBILITY
        // =========================================================

        [MaxLength(200)]
        public string? ResponsiblePerson { get; set; }

        public int? ResponsibleMemberId { get; set; }

        [ForeignKey(nameof(ResponsibleMemberId))]
        public virtual Member? ResponsibleMember { get; set; }

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "PENDING";

        // PENDING
        // IN_PROGRESS
        // READY
        // CANCELLED

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
        // NOTES
        // =========================================================

        public string? Notes { get; set; }

        // =========================================================
        // DATES
        // =========================================================

        public DateTime? NeededBy { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}