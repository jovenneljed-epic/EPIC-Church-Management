using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class Certificate
    {
        [Key]
        public int CertificateId { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string CertificateNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string RecipientName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string CourseTitle { get; set; } = string.Empty;

        public DateTime IssuedDate { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? CertificateUrl { get; set; }

        public Course? Course { get; set; }

        public User? User { get; set; }
    }
}