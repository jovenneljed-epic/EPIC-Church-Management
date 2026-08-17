using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class CourseEnrollment
    {
        [Key]
        public int CourseEnrollmentId { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        public int UserId { get; set; }

        public DateTime EnrolledDate { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedDate { get; set; }

        public bool IsCompleted { get; set; } = false;

        public int ProgressPercentage { get; set; } = 0;

        public Course? Course { get; set; }

        public User? User { get; set; }

        public ICollection<LessonProgress> LessonProgresses { get; set; }
            = new List<LessonProgress>();
    }
}