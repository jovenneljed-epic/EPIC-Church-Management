using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class CRBreakPass
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int CRBreakPassId { get; set; }

        // =========================================================
        // MEMBER
        // =========================================================

        [Required]
        public int MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public virtual Member? Member { get; set; }

        // =========================================================
        // PASS INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string PassCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string QrToken { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "ACTIVE";

        // Possible values:
        // ACTIVE
        // USED
        // EXPIRED
        // CANCELLED

        // =========================================================
        // PASS DATES
        // =========================================================

        [Required]
        public DateTime IssuedAt { get; set; } = DateTime.Now;

        public DateTime? TimeOut { get; set; }

        public DateTime? TimeIn { get; set; }

        public DateTime? ExpiresAt { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [MaxLength(150)]
        public string? CreatedBy { get; set; }
    }
}