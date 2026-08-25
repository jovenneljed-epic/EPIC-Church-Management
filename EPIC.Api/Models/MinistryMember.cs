using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class MinistryMember
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int MinistryMemberId { get; set; }

        // =========================================================
        // MINISTRY
        // =========================================================

        [Required]
        public int MinistryId { get; set; }

        [ForeignKey(nameof(MinistryId))]
        public virtual Ministry? Ministry { get; set; }

        // =========================================================
        // MEMBER
        // =========================================================

        [Required]
        public int MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public virtual Member? Member { get; set; }

        // =========================================================
        // ROLE / POSITION
        // =========================================================

        [MaxLength(100)]
        public string Role { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Position { get; set; } = string.Empty;

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "ACTIVE";

        // =========================================================
        // NOTES
        // =========================================================

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        // =========================================================
        // ASSIGNMENT DATES
        // =========================================================

        [Required]
        public DateTime DateAssigned { get; set; } = DateTime.Now;

        public DateTime? DateEnded { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}