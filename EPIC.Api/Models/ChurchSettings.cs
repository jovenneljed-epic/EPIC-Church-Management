using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class ChurchSettings
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int ChurchSettingsId { get; set; }

        // =========================================================
        // CHURCH INFORMATION
        // =========================================================

        [Required]
        [MaxLength(200)]
        public string ChurchName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string ChurchCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        // =========================================================
        // CONTACT INFORMATION
        // =========================================================

        [MaxLength(50)]
        public string ContactNumber { get; set; } = string.Empty;

        [MaxLength(150)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        // =========================================================
        // CHURCH LEADERSHIP
        // =========================================================

        [Required]
        [MaxLength(200)]
        public string PastorName { get; set; } = string.Empty;

        // =========================================================
        // BRANDING
        // =========================================================

        [MaxLength(500)]
        public string LogoPath { get; set; } = string.Empty;

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime UpdatedDate { get; set; } = DateTime.Now;
    }
}