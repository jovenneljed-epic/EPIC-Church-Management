namespace EPIC.Api.DTOs
{
    public class MinistryEvaluationDto
    {

        public int MinistryId { get; set; }


        public string MinistryName { get; set; }
            = string.Empty;


        public string MinistryHead { get; set; }
            = string.Empty;


        public string Description { get; set; }
            = string.Empty;


        public string MeetingDay { get; set; }
            = string.Empty;


        public string MeetingTime { get; set; }
            = string.Empty;


        public string MeetingLocation { get; set; }
            = string.Empty;


        public int TotalMembers { get; set; }


        public List<MinistryMemberEvaluationDto> Members { get; set; }
            = new();

    }



    public class MinistryMemberEvaluationDto
    {

        public int MemberId { get; set; }


        public string Name { get; set; }
            = string.Empty;


        public string Role { get; set; }
            = string.Empty;


        public string Position { get; set; }
            = string.Empty;


        public string PhotoPath { get; set; }
            = string.Empty;

    }
}