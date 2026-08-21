using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventNeed
    {
        [Key]
        public int EventNeedId { get; set; }

        // =========================================================
        // EVENT
        // =========================================================

        [Required]
        public int EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public Event? Event { get; set; }


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

        // Examples:
        // Equipment
        // Supplies
        // Food
        // Transportation
        // Venue
        // Technical
        // Decoration
        // Others


        // =========================================================
        // QUANTITY
        // =========================================================

        public decimal Quantity { get; set; } = 1;

        [MaxLength(50)]
        public string? Unit { get; set; }


        // =========================================================
        // RESPONSIBILITY
        // =========================================================

        [MaxLength(200)]
        public string? ResponsiblePerson { get; set; }

        public int? ResponsibleMemberId { get; set; }

        [ForeignKey(nameof(ResponsibleMemberId))]
        public Member? ResponsibleMember { get; set; }


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

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}