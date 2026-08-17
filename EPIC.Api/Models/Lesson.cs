using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Lesson
    {
        [Key]
        public int LessonId { get; set; }

        [Required]
        public int CourseModuleId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        [MaxLength(500)]
        public string? VideoUrl { get; set; }

        [MaxLength(500)]
        public string? ResourceUrl { get; set; }

        public int SortOrder { get; set; }

        public int EstimatedMinutes { get; set; }

        public bool IsPublished { get; set; } = true;

        public bool IsFreePreview { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        public CourseModule? CourseModule { get; set; }

        public ICollection<LessonProgress> ProgressRecords { get; set; }
            = new List<LessonProgress>();
    }
}