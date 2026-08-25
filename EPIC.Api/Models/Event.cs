using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Event
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int EventId { get; set; }

        // =========================================================
        // EVENT INFORMATION
        // =========================================================

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EventType { get; set; } = string.Empty;

        [Required]
        public DateTime EventDate { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        public TimeSpan? EndTime { get; set; }

        // =========================================================
        // LOCATION / LEADERSHIP
        // =========================================================

        [MaxLength(200)]
        public string? Venue { get; set; }

        [MaxLength(200)]
        public string? Speaker { get; set; }

        [MaxLength(150)]
        public string? Ministry { get; set; }

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "SCHEDULED";

        // =========================================================
        // DESCRIPTION / NOTES
        // =========================================================

        public string? Description { get; set; }

        public string? Notes { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        // =========================================================
        // EVENT ASSIGNMENTS
        // =========================================================

        public ICollection<EventAssignment> EventAssignments { get; set; }
            = new List<EventAssignment>();

        // =========================================================
        // EVENT NEEDS
        // =========================================================

        public ICollection<EventNeed> EventNeeds { get; set; }
            = new List<EventNeed>();

        // =========================================================
        // EVENT CHECKLISTS
        // =========================================================

        public ICollection<EventChecklist> EventChecklists { get; set; }
            = new List<EventChecklist>();
    }
}