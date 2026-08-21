using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.DTOs
{
    // =========================================================
    // CREATE DTO
    // =========================================================

    public class CreateEventAssignmentDto
    {
        [Required]
        public int EventId { get; set; }

        public int? EventDepartmentId { get; set; }

        public int? EventRoleId { get; set; }

        public int? MemberId { get; set; }

        [MaxLength(150)]
        public string? RoleName { get; set; }

        [MaxLength(200)]
        public string? AssignedPerson { get; set; }

        [MaxLength(150)]
        public string? DepartmentName { get; set; }

        [MaxLength(50)]
        public string? AssignmentStatus { get; set; }

        [MaxLength(50)]
        public string? Priority { get; set; }

        public string? Notes { get; set; }
    }


    // =========================================================
    // UPDATE DTO
    // =========================================================

    public class UpdateEventAssignmentDto
    {
        public int? EventDepartmentId { get; set; }

        public int? EventRoleId { get; set; }

        public int? MemberId { get; set; }

        [MaxLength(150)]
        public string? RoleName { get; set; }

        [MaxLength(200)]
        public string? AssignedPerson { get; set; }

        [MaxLength(150)]
        public string? DepartmentName { get; set; }

        [MaxLength(50)]
        public string? AssignmentStatus { get; set; }

        [MaxLength(50)]
        public string? Priority { get; set; }

        public string? Notes { get; set; }
    }
}