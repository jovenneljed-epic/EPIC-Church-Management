
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Giving
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int GivingId { get; set; }

        // =========================================================
        // CUSTOMER / TENANT
        // =========================================================


        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer? Customer { get; set; }

        // =========================================================
        // MEMBER
        // =========================================================

        public int? MemberId { get; set; }

        [ForeignKey(nameof(MemberId))]
        public virtual Member? Member { get; set; }

        // =========================================================
        // CHURCH SERVICE
        // =========================================================

        public int? ChurchServiceId { get; set; }

        [ForeignKey(nameof(ChurchServiceId))]
        public virtual ChurchService? ChurchService { get; set; }

        // =========================================================
        // GIVING INFORMATION
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string GivingType { get; set; } = "OFFERING";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTime GivingDate { get; set; } = DateTime.Now;

        // =========================================================
        // PAYMENT
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "CASH";

        [MaxLength(100)]
        public string ReferenceNumber { get; set; } = string.Empty;

        // =========================================================
        // NOTES
        // =========================================================

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        // =========================================================
        // RECORD INFORMATION
        // =========================================================

        [MaxLength(100)]
        public string RecordedBy { get; set; } = string.Empty;

        [Required]
        public DateTime RecordedDate { get; set; } = DateTime.Now;
    }
}

