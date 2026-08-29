
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventAssignment
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int EventAssignmentId { get; set; }

        // =========================================================
        // EVENT
        // =========================================================

        [Required]
        public int EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public virtual Event? Event { get; set; }

        // =========================================================
        // EVENT DEPARTMENT
        // =========================================================

        /// <summary>
        /// Optional department reference.
        /// Nullable so assignments can still exist without
        /// a formally configured department.
        /// </summary>
        public int? EventDepartmentId { get; set; }

        [ForeignKey(nameof(EventDepartmentId))]
        public virtual EventDepartment? EventDepartment { get; set; }

        // =========================================================
        // EVENT ROLE
        // =========================================================

        /// <summary>
        /// Optional role reference.
        /// Nullable so assignments can still exist without
        /// a formally configured role.
        /// </summary>
        public int? EventRoleId { get; set; }

        [ForeignKey(nameof(EventRoleId))]
        public virtual EventRole? EventRole { get; set; }

        // =========================================================
        // MEMBER
        // =========================================================

        public int? MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public virtual Member? Member { get; set; }

        // =========================================================
        // ASSIGNMENT INFORMATION
        // =========================================================

        /// <summary>
        /// Name of the assigned person.
        /// This can be used for manual/non-member assignments.
        /// </summary>
        [MaxLength(200)]
        public string? AssignedPerson { get; set; }

        /// <summary>
        /// Snapshot/display name of the department.
        /// The formal relationship is EventDepartmentId.
        /// </summary>
        [MaxLength(150)]
        public string? DepartmentName { get; set; }

        /// <summary>
        /// Snapshot/display name of the role.
        /// The formal relationship is EventRoleId.
        /// </summary>
        [MaxLength(150)]
        public string? RoleName { get; set; }

        // =========================================================
        // ASSIGNMENT STATUS
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string AssignmentStatus { get; set; } = "PENDING";

        // PENDING
        // ACCEPTED
        // DECLINED
        // COMPLETED
        // CANCELLED

        // =========================================================
        // PRIORITY
        // =========================================================

        [Required]
        [MaxLength(50)]
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
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}

