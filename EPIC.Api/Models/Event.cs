using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Event
    {
        [Key]
        public int EventId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EventType { get; set; } = string.Empty;

        [Required]
        public DateTime EventDate { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        public TimeSpan? EndTime { get; set; }

        [MaxLength(200)]
        public string? Venue { get; set; }

        [MaxLength(200)]
        public string? Speaker { get; set; }

        [MaxLength(150)]
        public string? Ministry { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "SCHEDULED";

        public string? Description { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}