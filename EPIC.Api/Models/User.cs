using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class User
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int UserId { get; set; }

        // =========================================================
        // LOGIN INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        // =========================================================
        // ROLE
        // =========================================================

        [Required]
        public int RoleId { get; set; }

        public virtual Role? Role { get; set; }

        // =========================================================
        // MEMBER RELATIONSHIP
        // =========================================================

        public int? MemberId { get; set; }

        public virtual Member? Member { get; set; }

        // =========================================================
        // CUSTOMER / CHURCH TENANT
        // =========================================================
        //
        // Every CLIENT account belongs to one Customer.
        //
        // This is the foundation for tenant isolation:
        //
        // Customer A → only Customer A data
        // Customer B → only Customer B data
        //
        // ADMIN / SYSTEM users may have CustomerId = NULL.
        // =========================================================

        public int? CustomerId { get; set; }

        public virtual Customer? Customer { get; set; }

        // =========================================================
        // ACCOUNT STATUS
        // =========================================================

        [Required]
        public bool IsActive { get; set; } = true;

        // =========================================================
        // APPROVAL STATUS
        // =========================================================
        //
        // PENDING
        // APPROVED
        // REJECTED
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string ApprovalStatus { get; set; } = "APPROVED";

        // =========================================================
        // ACCOUNT TYPE
        // =========================================================
        //
        // SYSTEM  = EPIC administrators
        // CLIENT  = subscribing church account
        // MEMBER  = church member login
        // STAFF   = church staff login
        //
        // RoleId remains the primary authorization mechanism.
        // AccountType provides an explicit account classification.
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string AccountType { get; set; } = "CLIENT";

        // =========================================================
        // EMAIL
        // =========================================================

        [MaxLength(200)]
        [EmailAddress]
        public string? Email { get; set; }

        // =========================================================
        // LAST LOGIN
        // =========================================================

        public DateTime? LastLoginDate { get; set; }

        // =========================================================
        // PASSWORD / SECURITY AUDIT
        // =========================================================

        public DateTime? PasswordChangedDate { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}