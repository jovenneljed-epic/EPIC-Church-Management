using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Visitor
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int VisitorId { get; set; }

        // =========================================================
        // VISITOR CODE
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string VisitorCode { get; set; } = string.Empty;

        // =========================================================
        // PERSONAL INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string MiddleName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Gender { get; set; } = string.Empty;

        public DateTime? BirthDate { get; set; }

        // =========================================================
        // CONTACT INFORMATION
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string ContactNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Address { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Email { get; set; }

        // =========================================================
        // VISITOR INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string InvitedBy { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Ministry { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "ACTIVE";

        // =========================================================
        // VISIT TRACKING
        // =========================================================

        public DateTime? FirstVisitDate { get; set; }

        public int VisitCount { get; set; } = 0;

        [MaxLength(50)]
        public string FollowUpStatus { get; set; } = "PENDING";

        // =========================================================
        // CONVERSION TO MEMBER
        // =========================================================

        public bool IsConvertedToMember { get; set; } = false;

        public int? ConvertedMemberId { get; set; }

        [ForeignKey(nameof(ConvertedMemberId))]
        public virtual Member? ConvertedMember { get; set; }

        public DateTime? ConversionDate { get; set; }

        // =========================================================
        // NOTES
        // =========================================================

        [Required]
        [MaxLength(250)]
        public string Notes { get; set; } = string.Empty;

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        // =========================================================
        // ATTENDANCE
        // =========================================================

        public virtual ICollection<VisitorAttendance> VisitorAttendances
        {
            get;
            set;
        } = new List<VisitorAttendance>();
    }
}