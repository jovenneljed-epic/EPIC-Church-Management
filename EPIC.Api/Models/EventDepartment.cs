using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventDepartment
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int EventDepartmentId { get; set; }

        // =========================================================
        // EVENT
        // =========================================================

        [Required]
        public int EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public virtual Event? Event { get; set; }

        // =========================================================
        // DEPARTMENT INFORMATION
        // =========================================================

        [Required]
        [MaxLength(150)]
        public string DepartmentName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? DepartmentDescription { get; set; }

        // =========================================================
        // DEPARTMENT HEAD
        // =========================================================

        public int? DepartmentHeadMemberId { get; set; }

        [ForeignKey(nameof(DepartmentHeadMemberId))]
        public virtual Member? DepartmentHeadMember { get; set; }

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
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "PLANNING";

        // PLANNING
        // ACTIVE
        // COMPLETED
        // CANCELLED

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        // =========================================================
        // EVENT ROLES
        // =========================================================

        public virtual ICollection<EventRole> EventRoles { get; set; }
            = new List<EventRole>();

        // =========================================================
        // EVENT ASSIGNMENTS
        // =========================================================

        public virtual ICollection<EventAssignment> EventAssignments { get; set; }
            = new List<EventAssignment>();
    }
}