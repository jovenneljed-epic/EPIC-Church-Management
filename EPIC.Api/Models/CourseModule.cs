using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class CourseModule
    {
        [Key]
        public int CourseModuleId { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int SortOrder { get; set; }

        public bool IsPublished { get; set; } = true;

        public Course? Course { get; set; }

        public ICollection<Lesson> Lessons { get; set; }
            = new List<Lesson>();
    }
}