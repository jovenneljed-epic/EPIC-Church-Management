using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Visitor
    {
        [Key]
        public int VisitorId { get; set; }

        [MaxLength(50)]
        public string VisitorCode { get; set; } = "";

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = "";

        [MaxLength(100)]
        public string MiddleName { get; set; } = "";

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = "";

        [MaxLength(20)]
        public string Gender { get; set; } = "";

        public DateTime? BirthDate { get; set; }

        [MaxLength(50)]
        public string ContactNumber { get; set; } = "";

        [MaxLength(250)]
        public string Address { get; set; } = "";

        [MaxLength(100)]
        public string InvitedBy { get; set; } = "";

        [MaxLength(100)]
        public string Ministry { get; set; } = "";

        // =====================================================
        // VISIT INFORMATION
        // =====================================================

        public DateTime FirstVisitDate { get; set; }

        public int VisitCount { get; set; }

        [MaxLength(50)]
        public string FollowUpStatus { get; set; } = "NEW";

        [MaxLength(50)]
        public string Status { get; set; } = "ACTIVE";

        [MaxLength(250)]
        public string Notes { get; set; } = "";

        // =====================================================
        // RECORD INFORMATION
        // =====================================================
        // =====================================================
        // MEMBERSHIP CONVERSION
        // =====================================================

        public bool IsConvertedToMember { get; set; } = false;

        public int? ConvertedMemberId { get; set; }

        public DateTime? ConversionDate { get; set; }
        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}