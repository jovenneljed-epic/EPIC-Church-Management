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

        // Foreign key to Roles table
        public int RoleId { get; set; }

        // Navigation property
        public Role? Role { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}