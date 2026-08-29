using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class VisitorAttendance
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int VisitorAttendanceId { get; set; }

        // =========================================================
        // VISITOR
        // =========================================================

        [Required]
        public int VisitorId { get; set; }

        [ForeignKey(nameof(VisitorId))]
        public virtual Visitor? Visitor { get; set; }

        // =========================================================
        // CHURCH SERVICE
        // =========================================================

        [Required]
        public int ChurchServiceId { get; set; }

        [ForeignKey(nameof(ChurchServiceId))]
        public virtual ChurchService? ChurchService { get; set; }

        // =========================================================
        // ATTENDANCE INFORMATION
        // =========================================================

        [Required]
        public DateTime AttendanceDate { get; set; } = DateTime.Now;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "PRESENT";

        // PRESENT
        // LATE
        // EARLY
        // ABSENT
        // EXCUSED

        // =========================================================
        // RECORD INFORMATION
        // =========================================================

        [MaxLength(100)]
        public string RecordedBy { get; set; } = string.Empty;

        [Required]
        public DateTime RecordedDate { get; set; } = DateTime.Now;
    }
}