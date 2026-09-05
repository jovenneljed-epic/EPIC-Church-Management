namespace EPIC.Api.DTOs
{

    public class MinistryEvaluationDetailDto
    {

        public int MinistryId { get; set; }


        public string MinistryName { get; set; }
            = string.Empty;


        public string MinistryHead { get; set; }
            = string.Empty;


        public string Description { get; set; }
            = string.Empty;



        public string MeetingSchedule { get; set; }
            = string.Empty;



        public int TotalMembers { get; set; }



        public List<RoleSummaryDto> Roles { get; set; }
            = new();



        public List<ActivitySummaryDto> Activities { get; set; }
            = new();



        public AttendanceSummaryDto Attendance { get; set; }
            = new();



        public PerformanceSummaryDto Performance { get; set; }
            = new();


    }



    public class RoleSummaryDto
    {

        public string Role { get; set; }
            = string.Empty;


        public int Count { get; set; }

    }



    public class ActivitySummaryDto
    {

        public string ServiceName { get; set; }
            = string.Empty;


        public DateTime Date { get; set; }

    }



    public class AttendanceSummaryDto
    {

        public int TotalAttendance { get; set; }


        public double AverageAttendance { get; set; }

    }



    public class PerformanceSummaryDto
    {

        public int Leadership { get; set; }


        public int Teamwork { get; set; }


        public int Commitment { get; set; }

    }


}