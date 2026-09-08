using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class EventAttendance
    {
        [Key]
        public int EventAttendanceId { get; set; }


        [Required]
        public int EventId { get; set; }

        [ForeignKey(nameof(EventId))]
        public virtual Event? Event { get; set; }


        [Required]
        public int MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public virtual Member? Member { get; set; }


        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "PRESENT";


        [Required]
        public DateTime AttendanceDate { get; set; }
            = DateTime.Now;


        [MaxLength(150)]
        public string RecordedBy { get; set; }
            = "QR SCANNER";


        [Required]
        public DateTime RecordedDate { get; set; }
            = DateTime.Now;
    }
}