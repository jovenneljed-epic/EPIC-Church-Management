using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Ministry
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int MinistryId { get; set; }

        // =========================================================
        // MINISTRY INFORMATION
        // =========================================================

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string MinistryCode { get; set; } = string.Empty;

        [MaxLength(100)]
        public string MinistryHead { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ContactNumber { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        // =========================================================
        // MEETING INFORMATION
        // =========================================================

        [MaxLength(50)]
        public string MeetingDay { get; set; } = string.Empty;

        [MaxLength(50)]
        public string MeetingTime { get; set; } = string.Empty;

        [MaxLength(250)]
        public string MeetingLocation { get; set; } = string.Empty;

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "ACTIVE";

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}