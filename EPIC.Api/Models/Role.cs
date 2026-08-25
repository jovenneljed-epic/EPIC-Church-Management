using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Role
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int RoleId { get; set; }

        // =========================================================
        // ROLE INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Description { get; set; } = string.Empty;

        // =========================================================
        // STATUS
        // =========================================================

        public bool IsActive { get; set; } = true;

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // =========================================================
        // NAVIGATION PROPERTIES
        // =========================================================

        public virtual ICollection<User> Users { get; set; }
            = new List<User>();

        public virtual ICollection<Permission> Permissions { get; set; }
            = new List<Permission>();
    }
}