using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Attendance
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int AttendanceId { get; set; }

        // =========================================================
        // MEMBER
        // =========================================================

        [Required]
        public int MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public virtual Member? Member { get; set; }

        // =========================================================
        // CHURCH SERVICE
        // =========================================================

        public int? ChurchServiceId { get; set; }

        [ForeignKey(nameof(ChurchServiceId))]
        public virtual ChurchService? ChurchService { get; set; }

        // =========================================================
        // EVENT
        // =========================================================

        public int? EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public virtual Event? Event { get; set; }

        // =========================================================
        // ATTENDANCE INFORMATION
        // =========================================================

        [Required]
        public DateTime AttendanceDate { get; set; } = DateTime.Now;

        // Legacy compatibility field.
        // Keep this property to prevent breaking existing
        // controllers, reports, or database columns.
        public string Service { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "PRESENT";

        // Possible values:
        // PRESENT
        // LATE
        // EARLY
        // ABSENT
        // EXCUSED

        // =========================================================
        // RECORD INFORMATION
        // =========================================================

        [MaxLength(150)]
        public string RecordedBy { get; set; } = string.Empty;

        [Required]
        public DateTime RecordedDate { get; set; } = DateTime.Now;
    }
}