namespace EPIC.Api.Models;

public static class QrPurpose
{
    public static bool IsEvent(string purpose) => purpose is "EVENT" or "EVANGELISM" or "SEMINAR" or "LEADERSHIP_MEETING" or "OTHER" or "FOOD_RESERVATION";

    public static bool Matches(string purpose, string eventType)
    {
        var category = eventType.Trim().ToUpperInvariant().Replace('_', ' ').Replace('-', ' ');
        return purpose switch
        {
            "EVANGELISM" => category is "EVANGELISM" or "OUTREACH",
            "SEMINAR" => category is "SEMINAR" or "SEMINARS",
            "LEADERSHIP_MEETING" => category is "LEADERSHIP MEETING" or "LEADERSHIP MEETINGS",
            "FOOD_RESERVATION" => category is "FOOD RESERVATION" or "FOOD RESERVATIONS",
            "OTHER" => category is "OTHER" or "OTHER ACTIVITY" or "OTHER ACTIVITIES",
            "EVENT" => category is not ("FOOD RESERVATION" or "FOOD RESERVATIONS"),
            _ => false
        };
    }
}
