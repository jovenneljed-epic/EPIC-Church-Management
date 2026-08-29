using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class ClientMember
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int ClientMemberId { get; set; }

        // =========================================================
        // CUSTOMER
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public Customer? Customer { get; set; }

        // =========================================================
        // MEMBER
        // =========================================================

        [Required]
        public int MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public Member? Member { get; set; }

        // =========================================================
        // CLIENT ROLE
        // =========================================================

  
        public int ClientRoleId { get; set; }

        [ForeignKey(nameof(ClientRoleId))]
        public ClientRole? ClientRole { get; set; }

        // =========================================================
        // CLIENT ACCOUNT
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        // =========================================================
        // ACCOUNT STATUS
        // =========================================================

        [MaxLength(30)]
        public string Status { get; set; } = "ACTIVE";

        public bool IsActive { get; set; } = true;

        // =========================================================
        // DATES
        // =========================================================

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginDate { get; set; }

        // =========================================================
        // OPTIONAL PROFILE / SECURITY
        // =========================================================

        [MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? ContactNumber { get; set; }
    }
}