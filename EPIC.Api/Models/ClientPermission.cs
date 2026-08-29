using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class ClientPermission
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int ClientPermissionId { get; set; }

        // =========================================================
        // CLIENT ROLE
        // =========================================================

        [Required]
        public int ClientRoleId { get; set; }

        [ForeignKey(nameof(ClientRoleId))]
        public ClientRole? ClientRole { get; set; }

        // =========================================================
        // MODULE
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string ModuleName { get; set; } = string.Empty;

        // =========================================================
        // PERMISSIONS
        // =========================================================

        public bool CanView { get; set; } = false;

        public bool CanCreate { get; set; } = false;

        public bool CanEdit { get; set; } = false;

        public bool CanDelete { get; set; } = false;

        public bool CanManage { get; set; } = false;

        // =========================================================
        // DATE
        // =========================================================

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}