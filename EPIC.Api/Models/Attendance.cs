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

        [ForeignKey("MemberId")]
        public Member? Member { get; set; }

        // =====================================================
        // CHURCH SERVICE
        // =====================================================

        public int? ChurchServiceId { get; set; }

        [ForeignKey("ChurchServiceId")]
        public ChurchService? ChurchService { get; set; }

        // =====================================================
        // ATTENDANCE INFORMATION
        // =====================================================

        [Required]
        public DateTime AttendanceDate { get; set; }

        // Keep existing field for compatibility
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