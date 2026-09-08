using EPIC.Api.Models;

namespace EPIC.Api.Services
{
    public class AttendanceStatusService
    {
        private const int GraceMinutes = 15;


        public string GetStatus(
            ChurchService service,
            DateTime scanTime)
        {
            if (!DateTime.TryParse(
                    service.ServiceDate.ToString("yyyy-MM-dd")
                    + " "
                    + service.StartTime,
                    out var startTime))
            {
                return "PRESENT";
            }


            var lateTime =
                startTime.AddMinutes(GraceMinutes);


            if (scanTime < startTime)
            {
                return "EARLY";
            }


            if (scanTime <= lateTime)
            {
                return "PRESENT";
            }


            return "LATE";
        }
    }
}