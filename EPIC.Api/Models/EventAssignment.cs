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
        public Event? Event { get; set; }


        // =========================================================
        // EVENT DEPARTMENT
        // =========================================================

        public int? EventDepartmentId { get; set; }

        [ForeignKey(nameof(EventDepartmentId))]
        public EventDepartment? EventDepartment { get; set; }


        // =========================================================
        // EVENT ROLE
        // =========================================================

        public int? EventRoleId { get; set; }

        [ForeignKey(nameof(EventRoleId))]
        public EventRole? EventRole { get; set; }


        // =========================================================
        // MEMBER
        // =========================================================

        public int? MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public Member? Member { get; set; }


        // =========================================================
        // ASSIGNMENT INFORMATION
        // =========================================================

        [MaxLength(200)]
        public string? AssignedPerson { get; set; }

        [MaxLength(150)]
        public string? DepartmentName { get; set; }

        [MaxLength(150)]
        public string? RoleName { get; set; }


        // =========================================================
        // STATUS
        // IMPORTANT:
        // The database column is AssignmentStatus.
        // There is NO Status property here.
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string AssignmentStatus { get; set; } = "PENDING";


        // =========================================================
        // PRIORITY
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Priority { get; set; } = "NORMAL";


        // =========================================================
        // NOTES
        // =========================================================

        public string? Notes { get; set; }


        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}