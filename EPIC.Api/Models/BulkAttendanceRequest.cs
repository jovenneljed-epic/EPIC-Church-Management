using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class BulkAttendanceRequest
    {
        [Required]
        public int ChurchServiceId { get; set; }

        [Required]
        public List<BulkAttendanceItem> Attendance { get; set; } = new();
    }

    public class BulkAttendanceItem
    {
        [Required]
        public int MemberId { get; set; }

        public string Status { get; set; } = "PRESENT";
    }
}