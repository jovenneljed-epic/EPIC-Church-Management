using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Expense
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int ExpenseId { get; set; }

        // =========================================================
        // CUSTOMER / TENANT
        // =========================================================

        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer? Customer { get; set; }

        // =========================================================
        // EXPENSE INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTime ExpenseDate { get; set; } = DateTime.Now;

        // =========================================================
        // PAYMENT
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "CASH";

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }

        // =========================================================
        // RECORD INFORMATION
        // =========================================================

        [MaxLength(150)]
        public string RecordedBy { get; set; } = "SYSTEM";

        [Required]
        public DateTime RecordedDate { get; set; } = DateTime.Now;
    }
}