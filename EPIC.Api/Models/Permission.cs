using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Permission
    {
        [Key]
        public int PermissionId { get; set; }

        public int RoleId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Module { get; set; } = "";

        public bool CanView { get; set; }

        public bool CanCreate { get; set; }

        public bool CanEdit { get; set; }

        public bool CanDelete { get; set; }

        public bool CanExport { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation property
        public Role? Role { get; set; }
    }
}