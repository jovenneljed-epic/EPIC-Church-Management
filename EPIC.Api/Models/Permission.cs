using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Permission
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int PermissionId { get; set; }

        // =========================================================
        // ROLE
        // =========================================================

        [Required]
        public int RoleId { get; set; }

        public virtual Role? Role { get; set; }

        // =========================================================
        // MODULE
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string Module { get; set; } = string.Empty;

        // =========================================================
        // PERMISSIONS
        // =========================================================

        public bool CanView { get; set; }

        public bool CanCreate { get; set; }

        public bool CanEdit { get; set; }

        public bool CanDelete { get; set; }

        public bool CanExport { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}