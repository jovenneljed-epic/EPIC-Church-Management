
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class ChurchService
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int ChurchServiceId { get; set; }

        // =========================================================
        // CUSTOMER / TENANT
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public Customer? Customer { get; set; }

        // =========================================================
        // SERVICE INFORMATION
        // =========================================================

        [Required]
        [MaxLength(150)]
        public string ServiceName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ServiceType { get; set; } = string.Empty;

        [Required]
        public DateTime ServiceDate { get; set; }

        [MaxLength(50)]
        public string StartTime { get; set; } = string.Empty;

        [MaxLength(50)]
        public string EndTime { get; set; } = string.Empty;

        // =========================================================
        // LOCATION
        // =========================================================

        [MaxLength(200)]
        public string Location { get; set; } = string.Empty;

        // =========================================================
        // LEADER / SPEAKER
        // =========================================================

        [MaxLength(150)]
        public string ServiceLeader { get; set; } = string.Empty;

        [MaxLength(150)]
        public string Speaker { get; set; } = string.Empty;

        // =========================================================
        // DESCRIPTION
        // =========================================================

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "SCHEDULED";

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}

