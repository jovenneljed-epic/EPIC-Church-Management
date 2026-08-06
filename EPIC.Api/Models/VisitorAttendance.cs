using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class VisitorAttendance
    {
        [Key]
        public int VisitorAttendanceId { get; set; }

        // =====================================================
        // VISITOR
        // =====================================================

        [Required]
        public int VisitorId { get; set; }

        [ForeignKey("VisitorId")]
        public Visitor? Visitor { get; set; }

        // =====================================================
        // CHURCH SERVICE
        // =====================================================

        [Required]
        public int ChurchServiceId { get; set; }

        [ForeignKey("ChurchServiceId")]
        public ChurchService? ChurchService { get; set; }

        // =====================================================
        // ATTENDANCE INFORMATION
        // =====================================================

        [Required]
        public DateTime AttendanceDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "PRESENT";

        // =====================================================
        // RECORD INFORMATION
        // =====================================================

        [MaxLength(100)]
        public string RecordedBy { get; set; } = "";

        public DateTime RecordedDate { get; set; }
    }
}