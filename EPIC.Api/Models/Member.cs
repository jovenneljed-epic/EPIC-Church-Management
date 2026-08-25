using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EPIC.Api.Models
{
    public class Member
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public int MemberId { get; set; }

        // =========================================================
        // CUSTOMER / CHURCH TENANT
        // =========================================================
        //
        // Every member belongs to exactly one subscribing church.
        //
        // This prevents:
        // Church A → seeing Church B members
        //
        // All member queries should be filtered by CustomerId.
        // =========================================================
        [Required]
        public int CustomerId { get; set; }

        public virtual Customer? Customer { get; set; }

        // =========================================================
        // MEMBER IDENTIFICATION
        // =========================================================

        [Required]
        [MaxLength(50)]
        public string MemberCode { get; set; } = string.Empty;

        // =========================================================
        // PERSONAL INFORMATION
        // =========================================================

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string MiddleName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Gender { get; set; } = string.Empty;

        public DateTime? BirthDate { get; set; }

        // =========================================================
        // CONTACT INFORMATION
        // =========================================================

        [MaxLength(50)]
        public string ContactNumber { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        // =========================================================
        // MEMBER INFORMATION
        // =========================================================

        [MaxLength(50)]
        public string CivilStatus { get; set; } = string.Empty;

        [MaxLength(150)]
        public string Ministry { get; set; } = string.Empty;

        public DateTime? DateJoined { get; set; }

        // =========================================================
        // STATUS
        // =========================================================

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "ACTIVE";

        // =========================================================
        // PHOTO
        // =========================================================

        [MaxLength(500)]
        public string PhotoPath { get; set; } = string.Empty;

        // =========================================================
        // AUDIT
        // =========================================================

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }
    }
}