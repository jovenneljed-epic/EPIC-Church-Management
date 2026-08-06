namespace EPIC.Api.Models
{
    public class Member
    {
        public int MemberId { get; set; }

        public string MemberCode { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string MiddleName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Gender { get; set; } = string.Empty;

        public DateTime? BirthDate { get; set; }

        public string ContactNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string CivilStatus { get; set; } = string.Empty;

        public string Ministry { get; set; } = string.Empty;

        public DateTime? DateJoined { get; set; }

        public string Status { get; set; } = "ACTIVE";

        public string PhotoPath { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}