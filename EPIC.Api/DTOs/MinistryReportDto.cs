namespace EPIC.Api.DTOs
{
    public class MinistryReportDto
    {
        // ==============================
        // MINISTRY INFORMATION
        // ==============================

        public int MinistryId { get; set; }

        public string MinistryName { get; set; } = string.Empty;

        public string ServiceType { get; set; } = string.Empty;



        // ==============================
        // MEMBERSHIP SUMMARY
        // ==============================

        public int MemberCount { get; set; }

        public int VolunteerCount { get; set; }



        // ==============================
        // ACTIVITY SUMMARY
        // ==============================

        public int UpcomingActivities { get; set; }

        public int TotalAttendance { get; set; }



        // ==============================
        // ACTIVITY HISTORY
        // ==============================

        public DateTime? LastActivity { get; set; }



        // ==============================
        // OPTIONAL DISPLAY HELPERS
        // ==============================

        public string LastActivityDisplay =>
            LastActivity.HasValue
            ?
            LastActivity.Value.ToString("MMM dd, yyyy")
            :
            "No activity yet";


        public string MinistryIcon
        {
            get
            {
                return ServiceType switch
                {
                    "SUNDAY WORSHIP" => "🙏",

                    "PRAYER MEETING" => "🔥",

                    "YOUTH FELLOWSHIP" => "⚡",

                    _ => "⛪"
                };
            }
        }
    }
}