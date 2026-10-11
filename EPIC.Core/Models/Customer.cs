using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Core.Models
{
    public class Customer
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int CustomerId { get; set; }

        // =========================================================
        // CHURCH INFORMATION
        // =========================================================

        [Required]
        [MaxLength(200)]
        public string ChurchName { get; set; } = string.Empty;

        // =========================================================
        // CONTACT INFORMATION
        // =========================================================

        [Required]
        [MaxLength(150)]
        public string ContactPerson { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Phone { get; set; }

        // =========================================================
        // CUSTOMER STATUS
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        // =========================================================
        // SETUP WIZARD STATUS
        // =========================================================

        [Required]
        public bool IsSetupCompleted { get; set; } = false;

        // =========================================================
        // PLAN PERMISSION OVERRIDES (MASTER ADMIN CONTROLLED)
        // =========================================================

        [MaxLength(1000)]
        public string? CustomAllowedModules { get; set; }

        public int? MaxUsersOverride { get; set; }

        public int? MaxMembersOverride { get; set; }

        // =========================================================
        // SOURCE DEMO REQUEST
        // =========================================================

        public int? DemoRequestId { get; set; }

        // =========================================================
        // DATES
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        // =========================================================
        // NAVIGATION PROPERTY
        // =========================================================

        public virtual DemoRequest? DemoRequest { get; set; }
    }
}