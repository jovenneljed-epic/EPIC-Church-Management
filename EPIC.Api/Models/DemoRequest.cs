using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class DemoRequest
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int DemoRequestId { get; set; }

        // =========================================================
        // CONTACT INFORMATION
        // =========================================================

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string ChurchName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Phone { get; set; }

        // =========================================================
        // DEMO INFORMATION
        // =========================================================

        [MaxLength(100)]
        public string? Position { get; set; }

        [MaxLength(1000)]
        public string? Message { get; set; }

        // =========================================================
        // REQUEST STATUS
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        // Possible values:
        // Pending
        // Contacted
        // Scheduled
        // Completed
        // Cancelled
        // Converted

        // =========================================================
        // ADMIN NOTES
        // =========================================================

        [MaxLength(2000)]
        public string? AdminNotes { get; set; }

        // =========================================================
        // DATES
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? ContactedDate { get; set; }

        public DateTime? DemoDate { get; set; }

        // =========================================================
        // CUSTOMER CONVERSION
        // =========================================================

        public bool IsConverted { get; set; } = false;

        public int? CustomerId { get; set; }

        public DateTime? ConvertedDate { get; set; }
    }
}