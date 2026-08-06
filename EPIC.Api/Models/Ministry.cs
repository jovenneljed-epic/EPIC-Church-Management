using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Ministry
    {
        [Key]
        public int MinistryId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = "";

        [MaxLength(50)]
        public string MinistryCode { get; set; } = "";

        [MaxLength(100)]
        public string MinistryHead { get; set; } = "";

        [MaxLength(50)]
        public string ContactNumber { get; set; } = "";

        [MaxLength(500)]
        public string Description { get; set; } = "";

        [MaxLength(50)]
        public string MeetingDay { get; set; } = "";

        [MaxLength(50)]
        public string MeetingTime { get; set; } = "";

        [MaxLength(250)]
        public string MeetingLocation { get; set; } = "";

        [MaxLength(50)]
        public string Status { get; set; } = "ACTIVE";

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}