using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Core.Models
{
    public class QrIdentity
    {
        [Key]
        public int QrIdentityId { get; set; }


        public int MemberId { get; set; }


        [Required]
        [MaxLength(200)]
        public string QrToken { get; set; } = string.Empty;


        // MEMBER, VISITOR, STAFF
        [Required]
        [MaxLength(50)]
        public string OwnerType { get; set; } = "MEMBER";


        public bool IsActive { get; set; } = true;


        public DateTime CreatedAt { get; set; }
            = DateTime.Now;


        public DateTime? UpdatedAt { get; set; }


        public virtual Member? Member { get; set; }
    }
}