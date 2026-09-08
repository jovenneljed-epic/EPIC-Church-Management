using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace EPIC.Api.Services;

// A basic abuse check, not a semantic/AI judgment or a guarantee of suitability.
// Do not block ordinary words such as "hell", "death" or "suffering": they occur
// in Scripture and respectful prayer requests. Reports and admin removal remain essential.
public static class CommunityTextPolicy
{
    private static readonly Regex ExplicitAbuse = new(@"\b(fuck(?:ing|er|ers)?|motherfucker|bullshit|asshole|putangina|tangina)\b|\b(kill yourself|i will kill you|you should die)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(100));
    public static string? Check(string body) {
        var normalized = body.Normalize(NormalizationForm.FormKC);
        normalized = string.Concat(normalized.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.Format));
        normalized = Regex.Replace(normalized, @"\s+", " ", RegexOptions.None, TimeSpan.FromMilliseconds(100));
        if (ExplicitAbuse.IsMatch(normalized)) return "Please revise the explicit or abusive language. Share something respectful, positive, biblical or helpful.";
        return null;
    }
}
