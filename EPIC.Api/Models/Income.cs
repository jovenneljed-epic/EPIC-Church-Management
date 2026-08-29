using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Income
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int IncomeId { get; set; }

        // =========================================================
        // CUSTOMER / TENANT
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer? Customer { get; set; }

        // =========================================================
        // INCOME INFORMATION
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTime IncomeDate { get; set; } = DateTime.Now;

        // =========================================================
        // PAYMENT
        // =========================================================

        [MaxLength(100)]
        public string PaymentMethod { get; set; } = string.Empty;

        [MaxLength(250)]
        public string ReferenceNumber { get; set; } = string.Empty;

        // =========================================================
        // RECORD INFORMATION
        // =========================================================

        [MaxLength(150)]
        public string RecordedBy { get; set; } = string.Empty;

        [Required]
        public DateTime RecordedDate { get; set; } = DateTime.Now;
    }
}