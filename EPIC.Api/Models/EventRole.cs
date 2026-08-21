using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventRole
    {
        // =====================================================
        // PRIMARY KEY
        // =====================================================

        [Key]
        public int EventRoleId { get; set; }

        // =====================================================
        // EVENT DEPARTMENT
        // =====================================================

        [Required]
        public int EventDepartmentId { get; set; }

        [ForeignKey(nameof(EventDepartmentId))]
        public EventDepartment? EventDepartment { get; set; }

        // =====================================================
        // ROLE INFORMATION
        // =====================================================

        [Required]
        [MaxLength(150)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? RoleDescription { get; set; }

        // =====================================================
        // STATUS
        // =====================================================

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "NORMAL";

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "ACTIVE";

        // =====================================================
        // DATES
        // =====================================================

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        // =====================================================
        // EVENT ASSIGNMENTS
        // IMPORTANT:
        // This navigation is explicitly connected to
        // EventAssignment.EventRole in ApplicationDbContext.
        // =====================================================

        public ICollection<EventAssignment> EventAssignments { get; set; }
            = new List<EventAssignment>();
    }
}