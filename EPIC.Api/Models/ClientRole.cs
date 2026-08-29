using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class ClientRole
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int ClientRoleId { get; set; }

        // =========================================================
        // CUSTOMER
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public Customer? Customer { get; set; }

        // =========================================================
        // ROLE INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        // =========================================================
        // ROLE TYPE
        // =========================================================

        public bool IsSystemRole { get; set; } = false;

        public bool IsActive { get; set; } = true;

        // =========================================================
        // DATES
        // =========================================================

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        // =========================================================
        // CLIENT MEMBERS
        // =========================================================

        public ICollection<ClientMember> ClientMembers { get; set; }
            = new List<ClientMember>();

        // =========================================================
        // CLIENT PERMISSIONS
        // =========================================================

        public ICollection<ClientPermission> ClientPermissions { get; set; }
            = new List<ClientPermission>();
    }
}