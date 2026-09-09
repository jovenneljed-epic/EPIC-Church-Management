using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Controllers;
public partial class ClientWorkspaceController
{
    private static readonly Dictionary<string, string> DocumentModules = new() { ["members"]="Members", ["attendance"]="Attendance", ["giving"]="Giving", ["income"]="Income", ["expenses"]="Expenses", ["visitors"]="Visitors", ["ministries"]="Ministries", ["services"]="Services" };
    [HttpGet("documents")]
    public async Task<IActionResult> DocumentCatalog()
    {
        var a = await Account("Reports"); if (a == null) return Denied();
        var kinds = new List<string>();
        foreach (var item in DocumentModules) if (await permissions.CanViewAsync(a.ClientRoleId, a.CustomerId, item.Value)) kinds.Add(item.Key);
        return Ok(new { churchName = a.Customer!.ChurchName, kinds });
    }
    [HttpGet("documents/{kind}")]
    public async Task<IActionResult> Document(string kind, DateTime from, DateTime to)
    {
        var a = await Account("Reports"); if (a == null) return Denied();
        if (!DocumentModules.TryGetValue(kind, out var module)) return NotFound();
        if (!await permissions.CanViewAsync(a.ClientRoleId, a.CustomerId, module)) return Denied();
        if (from == default || to == default || to < from || (to.Date-from.Date).TotalDays > 366 || to.Year >= 9999) return BadRequest(new { message="Choose a date range of at most 367 days." });
        var start=from.Date; var end=to.Date.AddDays(1); var c=a.CustomerId;
        // Limit explicitly; never present a truncated export as the complete report.
        System.Collections.IList rows = kind switch {
            "members" => await db.Members.AsNoTracking().Where(r=>r.CustomerId==c).OrderBy(r=>r.LastName).ThenBy(r=>r.MemberId).Take(10001).Select(r=>new {r.MemberCode,r.FirstName,r.LastName,r.Status}).ToListAsync(),
            "attendance" => await db.Attendances.AsNoTracking().Where(r=>r.Member!=null&&r.Member.CustomerId==c&&r.AttendanceDate>=start&&r.AttendanceDate<end&&(r.ChurchServiceId==null||r.ChurchService!=null&&r.ChurchService.CustomerId==c)&&(r.EventId==null||r.Event!=null&&r.Event.CustomerId==c)).OrderBy(r=>r.AttendanceDate).Take(10001).Select(r=>new {r.AttendanceDate,r.Member!.MemberCode,r.Member.FirstName,r.Member.LastName,r.Status}).ToListAsync(),
            "giving" => await db.Givings.AsNoTracking().Where(r=>r.CustomerId==c&&r.GivingDate>=start&&r.GivingDate<end).OrderBy(r=>r.GivingDate).Take(10001).Select(r=>new {r.GivingDate,r.GivingType,r.Amount}).ToListAsync(),
            "income" => await db.Incomes.AsNoTracking().Where(r=>r.CustomerId==c&&r.IncomeDate>=start&&r.IncomeDate<end).OrderBy(r=>r.IncomeDate).Take(10001).Select(r=>new {r.IncomeDate,r.Category,r.Description,r.Amount,r.PaymentMethod,r.ReferenceNumber}).ToListAsync(),
            "expenses" => await db.Expenses.AsNoTracking().Where(r=>r.CustomerId==c&&r.ExpenseDate>=start&&r.ExpenseDate<end).OrderBy(r=>r.ExpenseDate).Take(10001).Select(r=>new {r.ExpenseDate,r.Category,r.Description,r.Amount,r.PaymentMethod,r.ReferenceNumber}).ToListAsync(),
            "visitors" => await db.Visitors.AsNoTracking().Where(r=>r.CustomerId==c&&r.FirstVisitDate>=start&&r.FirstVisitDate<end).OrderBy(r=>r.FirstVisitDate).Take(10001).Select(r=>new {r.VisitorCode,r.FirstName,r.LastName,r.FirstVisitDate,r.ContactNumber,r.Status}).ToListAsync(),
            "ministries" => await db.Ministries.AsNoTracking().Where(r=>r.CustomerId==c).OrderBy(r=>r.Name).Take(10001).Select(r=>new {r.Name,r.Description,r.MeetingLocation,r.ContactNumber,r.Status}).ToListAsync(),
            _ => await db.ChurchServices.AsNoTracking().Where(r=>r.CustomerId==c&&r.ServiceDate>=start&&r.ServiceDate<end).OrderBy(r=>r.ServiceDate).Take(10001).Select(r=>new {r.ServiceName,r.ServiceDate,r.StartTime,r.EndTime,r.Location,r.Status}).ToListAsync()
        };
        if(rows.Count>10000)return BadRequest(new {message="This report exceeds 10,000 rows. Choose a smaller period; no partial export was generated."});
        return Ok(new {churchName=a.Customer!.ChurchName,kind,from=start,to=to.Date,currentDirectory=kind=="members"||kind=="ministries",rows});
    }
}
