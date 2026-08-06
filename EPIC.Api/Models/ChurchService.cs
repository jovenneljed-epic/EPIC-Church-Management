using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class ChurchService
    {
        [Key]
        public int ChurchServiceId { get; set; }

        // =====================================================
        // SERVICE INFORMATION
        // =====================================================

        [Required]
        [MaxLength(150)]
        public string ServiceName { get; set; } = "";

        [MaxLength(50)]
        public string ServiceType { get; set; } = "";

        public DateTime ServiceDate { get; set; }

        [MaxLength(50)]
        public string StartTime { get; set; } = "";

        [MaxLength(50)]
        public string EndTime { get; set; } = "";

        // =====================================================
        // LOCATION
        // =====================================================

        [MaxLength(200)]
        public string Location { get; set; } = "";

        // =====================================================
        // LEADER / SPEAKER
        // =====================================================

        [MaxLength(150)]
        public string ServiceLeader { get; set; } = "";

        [MaxLength(150)]
        public string Speaker { get; set; } = "";

        // =====================================================
        // DESCRIPTION
        // =====================================================

        [MaxLength(500)]
        public string Description { get; set; } = "";

        // =====================================================
        // STATUS
        // =====================================================

        [MaxLength(50)]
        public string Status { get; set; } = "SCHEDULED";

        // =====================================================
        // DATES
        // =====================================================

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}