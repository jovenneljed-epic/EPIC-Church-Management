using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Role
    {
        [Key]
        public int RoleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = "";

        [MaxLength(250)]
        public string Description { get; set; } = "";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation properties
        public ICollection<User> Users { get; set; }
            = new List<User>();

        public ICollection<Permission> Permissions { get; set; }
            = new List<Permission>();
    }
}