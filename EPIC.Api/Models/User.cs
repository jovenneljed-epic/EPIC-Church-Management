using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = "";

        [Required]
        public string PasswordHash { get; set; } = "";

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = "";

        // =====================================================
        // ROLE
        // =====================================================

        public int RoleId { get; set; }

        public Role? Role { get; set; }

        // =====================================================
        // MEMBER LINK
        // =====================================================

        // NULL for ADMIN / STAFF
        // Contains Members.MemberId for MEMBER accounts.
        public int? MemberId { get; set; }

        public Member? Member { get; set; }

        // =====================================================
        // ACCOUNT STATUS
        // =====================================================

        // false = waiting for Admin approval
        // true  = approved and allowed to login
        public bool IsActive { get; set; } = true;
public string ApprovalStatus { get; set; } = "APPROVED";
public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}

