using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Attendance
    {
        [Key]
        public int AttendanceId { get; set; }

        // =====================================================
        // MEMBER
        // =====================================================

        [Required]
        public int MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public Member? Member { get; set; }


        // =====================================================
        // CHURCH SERVICE
        // =====================================================

        public int? ChurchServiceId { get; set; }

        [ForeignKey(nameof(ChurchServiceId))]
        public ChurchService? ChurchService { get; set; }


        // =====================================================
        // EVENT
        // =====================================================

        public int? EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public Event? Event { get; set; }


        // =====================================================
        // ATTENDANCE INFORMATION
        // =====================================================

        [Required]
        public DateTime AttendanceDate { get; set; }

        // Legacy compatibility field
        public string Service { get; set; } = "";

        [Required]
        public string Status { get; set; } = "PRESENT";


        // =====================================================
        // RECORD INFORMATION
        // =====================================================

        public string RecordedBy { get; set; } = "";

        public DateTime RecordedDate { get; set; }
    }
}