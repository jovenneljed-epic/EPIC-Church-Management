using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        // CUSTOMER / TENANT
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer? Customer { get; set; }

        // =========================================================
        // MINISTRY INFORMATION
        // =========================================================

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? MinistryCode { get; set; }

        [MaxLength(100)]
        public string? MinistryHead { get; set; }

        [MaxLength(50)]
        public string? ContactNumber { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? ServiceTypeMapping { get; set; }

        // =========================================================
        // MEETING INFORMATION
        // =========================================================

        [MaxLength(50)]
        public string? MeetingDay { get; set; }

        [MaxLength(50)]
        public string? MeetingTime { get; set; }

        [MaxLength(250)]
        public string? MeetingLocation { get; set; }

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

        // =========================================================
        // MINISTRY MEMBERS
        // =========================================================

        public virtual ICollection<MinistryMember> MinistryMembers { get; set; }
            = new List<MinistryMember>();
    }
}