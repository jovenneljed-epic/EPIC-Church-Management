using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class MinistryMember
    {
        [Key]
        public int MinistryMemberId { get; set; }

        [Required]
        public int MinistryId { get; set; }

        [ForeignKey("MinistryId")]
        public Ministry? Ministry { get; set; }

        [Required]
        public int MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member? Member { get; set; }

        [MaxLength(100)]
        public string Role { get; set; } = "";

        [MaxLength(100)]
        public string Position { get; set; } = "";

        [MaxLength(50)]
        public string Status { get; set; } = "ACTIVE";

        [MaxLength(500)]
        public string Notes { get; set; } = "";

        public DateTime DateAssigned { get; set; }

        public DateTime? DateEnded { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}