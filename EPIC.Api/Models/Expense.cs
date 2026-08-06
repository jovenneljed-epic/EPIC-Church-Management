using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Expense
    {
        [Key]
        public int ExpenseId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = "";

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = "";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; }

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "CASH";

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }

        [MaxLength(150)]
        public string RecordedBy { get; set; } = "SYSTEM";

        public DateTime RecordedDate { get; set; } = DateTime.Now;
    }
}