using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        // CUSTOMER / TENANT
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer? Customer { get; set; }

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

        // SCHEDULED
        // ONGOING
        // COMPLETED
        // CANCELLED

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
        // EVENT DEPARTMENTS
        // =========================================================

        public virtual ICollection<EventDepartment> EventDepartments { get; set; }
            = new List<EventDepartment>();

        // =========================================================
        // EVENT ASSIGNMENTS
        // =========================================================

        public virtual ICollection<EventAssignment> EventAssignments { get; set; }
            = new List<EventAssignment>();

        // =========================================================
        // EVENT NEEDS
        // =========================================================

        public virtual ICollection<EventNeed> EventNeeds { get; set; }
            = new List<EventNeed>();

        // =========================================================
        // EVENT CHECKLISTS
        // =========================================================

        public virtual ICollection<EventChecklist> EventChecklists { get; set; }
            = new List<EventChecklist>();
    }
}