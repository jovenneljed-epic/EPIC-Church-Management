using EPIC.Api.Models;

namespace EPIC.Api.Services
{
    public class AttendanceStatusService
    {
        private const int GraceMinutes = 15;

        public static DateTime GetPhilippineTime(DateTime? utc = null)
        {
            var targetUtc = utc ?? DateTime.UtcNow;
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Manila");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(targetUtc, DateTimeKind.Utc), tz);
            }
            catch
            {
                try
                {
                    var tz = TimeZoneInfo.FindSystemTimeZoneById("Singapore Standard Time");
                    return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(targetUtc, DateTimeKind.Utc), tz);
                }
                catch
                {
                    return targetUtc.AddHours(8);
                }
            }
        }

        public string GetStatus(
            ChurchService service,
            DateTime? scanTime = null)
        {
            var actualScanTime = scanTime ?? GetPhilippineTime();

            if (!TimeSpan.TryParse(service.StartTime, out var startTimeSpan))
            {
                return "PRESENT";
            }

            var baseDate = service.ServiceDate.Date == actualScanTime.Date
                ? service.ServiceDate.Date
                : actualScanTime.Date;

            var startTime = baseDate.Add(startTimeSpan);
            var lateTime = startTime.AddMinutes(GraceMinutes);

            if (actualScanTime < startTime)
            {
                return "EARLY";
            }

            if (actualScanTime <= lateTime)
            {
                return "PRESENT";
            }

            return "LATE";
        }
    }
}