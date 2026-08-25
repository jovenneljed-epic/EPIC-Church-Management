using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventRole
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int EventRoleId { get; set; }

        // =========================================================
        // EVENT DEPARTMENT
        // =========================================================

        [Required]
        public int EventDepartmentId { get; set; }

        [ForeignKey(nameof(EventDepartmentId))]
        public EventDepartment? EventDepartment { get; set; }

        // =========================================================
        // ROLE INFORMATION
        // =========================================================

        [Required]
        [MaxLength(150)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? RoleDescription { get; set; }

        // =========================================================
        // PRIORITY
        // =========================================================

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "NORMAL";

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "ACTIVE";

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
    }
}