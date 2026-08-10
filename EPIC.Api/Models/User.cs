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

        public int RoleId { get; set; }

        public Role? Role { get; set; }

        // Links MEMBER user account to Members.MemberId
        public int? MemberId { get; set; }

        public Member? Member { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
