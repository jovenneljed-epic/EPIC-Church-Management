using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Income
    {
        [Key]
        public int IncomeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "";

        [Required]
        [MaxLength(250)]
        public string Description { get; set; } = "";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime IncomeDate { get; set; }

        [MaxLength(100)]
        public string PaymentMethod { get; set; } = "";

        [MaxLength(250)]
        public string ReferenceNumber { get; set; } = "";

        [MaxLength(100)]
        public string RecordedBy { get; set; } = "";

        public DateTime RecordedDate { get; set; }
    }
}