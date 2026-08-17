using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class LessonProgress
    {
        [Key]
        public int LessonProgressId { get; set; }

        [Required]
        public int CourseEnrollmentId { get; set; }

        [Required]
        public int LessonId { get; set; }

        public bool IsCompleted { get; set; } = false;

        public int ProgressPercentage { get; set; } = 0;

        public DateTime? StartedDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public CourseEnrollment? CourseEnrollment { get; set; }

        public Lesson? Lesson { get; set; }
    }
}