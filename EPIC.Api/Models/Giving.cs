using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Giving
    {
        [Key]
        public int GivingId { get; set; }

        // =====================================================
        // MEMBER
        // =====================================================

        public int? MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member? Member { get; set; }

        // =====================================================
        // CHURCH SERVICE
        // =====================================================

        public int? ChurchServiceId { get; set; }

        [ForeignKey("ChurchServiceId")]
        public ChurchService? ChurchService { get; set; }

        // =====================================================
        // GIVING INFORMATION
        // =====================================================

        [Required]
        [MaxLength(50)]
        public string GivingType { get; set; } = "OFFERING";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTime GivingDate { get; set; }

        // =====================================================
        // PAYMENT
        // =====================================================

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "CASH";

        [MaxLength(100)]
        public string ReferenceNumber { get; set; } = "";

        // =====================================================
        // NOTES
        // =====================================================

        [MaxLength(500)]
        public string Notes { get; set; } = "";

        // =====================================================
        // RECORD INFORMATION
        // =====================================================

        [MaxLength(100)]
        public string RecordedBy { get; set; } = "";

        public DateTime RecordedDate { get; set; }
    }
}