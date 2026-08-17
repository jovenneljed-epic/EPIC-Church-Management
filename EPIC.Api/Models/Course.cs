using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Course
    {
        [Key]
        public int CourseId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ShortDescription { get; set; }

        public string? Description { get; set; }

        [MaxLength(500)]
        public string? ThumbnailUrl { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        [MaxLength(50)]
        public string? Level { get; set; }

        public int EstimatedMinutes { get; set; }

        public bool IsPublished { get; set; } = false;

        public bool IsFeatured { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        public ICollection<CourseModule> Modules { get; set; }
            = new List<CourseModule>();

        public ICollection<CourseEnrollment> Enrollments { get; set; }
            = new List<CourseEnrollment>();

        public ICollection<Certificate> Certificates { get; set; }
            = new List<Certificate>();
    }
}