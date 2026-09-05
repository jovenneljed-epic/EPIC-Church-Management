using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Payment
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int PaymentId { get; set; }

        // =========================================================
        // SUBSCRIPTION
        // =========================================================

        [Required]
        public int SubscriptionId { get; set; }

        [ForeignKey(nameof(SubscriptionId))]
        public virtual Subscription? Subscription { get; set; }

        // =========================================================
        // PAYMENT INFORMATION
        // =========================================================

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(10)]
        public string Currency { get; set; } = "PHP";

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "Manual";

        // Possible values:
        // Manual
        // GCash
        // Maya
        // BankTransfer
        // Card
        // PayMongo

        // =========================================================
        // PAYMENT STATUS
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "PENDING";

        // Possible values:
        // PENDING
        // PAID
        // FAILED
        // CANCELLED
        // REFUNDED

        // =========================================================
        // PAYMENT REFERENCES
        // =========================================================

        [MaxLength(200)]
        public string? ReferenceNumber { get; set; }

        [MaxLength(200)]
        public string? GatewayPaymentId { get; set; }

        [MaxLength(200)]
        public string? GatewayCheckoutId { get; set; }

        [MaxLength(200)]
        public string? GatewayCustomerId { get; set; }

        // =========================================================
        // PAYMENT DATES
        // =========================================================

        public DateTime? PaidDate { get; set; }

        public DateTime? FailedDate { get; set; }

        // =========================================================
        // BILLING PERIOD
        // =========================================================

        public DateTime? BillingPeriodStart { get; set; }

        public DateTime? BillingPeriodEnd { get; set; }

        // =========================================================
        // INVOICE / RECEIPT
        // =========================================================

        [MaxLength(100)]
        public string? InvoiceNumber { get; set; }

        [MaxLength(100)]
        public string? ReceiptNumber { get; set; }

        // =========================================================
        // FAILURE INFORMATION
        // =========================================================

        [MaxLength(1000)]
        public string? FailureReason { get; set; }

        // =========================================================
        // NOTES
        // =========================================================

        [MaxLength(2000)]
        public string? Notes { get; set; }

        // =========================================================
        // PAYMENT PROOF
        // =========================================================

        [MaxLength(255)]
        public string? PaymentProofFileName { get; set; }

        [MaxLength(100)]
        public string? PaymentProofContentType { get; set; }

        public byte[]? PaymentProofData { get; set; }

        public DateTime? PaymentProofUploadedDate { get; set; }

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}