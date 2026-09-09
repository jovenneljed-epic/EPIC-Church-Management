using System.ComponentModel.DataAnnotations;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Controllers;
public partial class ClientWorkspaceController
{
    private static readonly Dictionary<string,string> RecordModules = new() { ["income"]="Income",["expenses"]="Expenses",["visitors"]="Visitors",["ministries"]="Ministries",["events"]="Events" };
    public class RecordRequest
    {
        [Required, StringLength(100)] public string Name {get;set;}="";
        [StringLength(100)] public string LastName {get;set;}="";
        [StringLength(50)] public string Category {get;set;}="OTHER";
        [StringLength(500)] public string Description {get;set;}="";
        [Range(typeof(decimal),"0","999999999999.99")] public decimal Amount {get;set;}
        public DateTime Date {get;set;}=DateTime.Today;
        [StringLength(20)] public string Phone {get;set;}="";
        [StringLength(150)] public string Location {get;set;}="";
        [StringLength(50)] public string? PaymentMethod {get;set;}
        [StringLength(100)] public string? ReferenceNumber {get;set;}
        [StringLength(30)] public string? Status {get;set;}
        public TimeSpan StartTime {get;set;}
        public TimeSpan? EndTime {get;set;}
    }
    private record RecordRow(int Id,string Name,string LastName,string Category,string Description,decimal Amount,DateTime Date,string Phone,string Location,TimeSpan StartTime,TimeSpan? EndTime,string Status="",string PaymentMethod="",string ReferenceNumber="");
    [HttpGet("records/{kind}")]
    public async Task<IActionResult> Records(string kind, int skip=0)
    {
        if(!RecordModules.TryGetValue(kind,out var module))return NotFound();
        var a=await Account(module);if(a==null)return Denied();
        if(skip<0)return BadRequest();
        var c=a.CustomerId;
        object rows=kind switch {
            "income"=>await db.Incomes.AsNoTracking().Where(r=>r.CustomerId==c).OrderByDescending(r=>r.IncomeId).Skip(skip).Take(50).Select(r=>new RecordRow(r.IncomeId,r.Category,"",r.Category,r.Description,r.Amount,r.IncomeDate,"","",TimeSpan.Zero,null,"",r.PaymentMethod,r.ReferenceNumber??"")).ToListAsync(),
            "expenses"=>await db.Expenses.AsNoTracking().Where(r=>r.CustomerId==c).OrderByDescending(r=>r.ExpenseId).Skip(skip).Take(50).Select(r=>new RecordRow(r.ExpenseId,r.Category,"",r.Category,r.Description,r.Amount,r.ExpenseDate,"","",TimeSpan.Zero,null,"",r.PaymentMethod,r.ReferenceNumber??"")).ToListAsync(),
            "visitors"=>await db.Visitors.AsNoTracking().Where(r=>r.CustomerId==c).OrderByDescending(r=>r.VisitorId).Skip(skip).Take(50).Select(r=>new RecordRow(r.VisitorId,r.FirstName,r.LastName,"",r.Notes,0,r.FirstVisitDate??r.CreatedDate,r.ContactNumber,r.Address,TimeSpan.Zero,null,r.Status)).ToListAsync(),
            "ministries"=>await db.Ministries.AsNoTracking().Where(r=>r.CustomerId==c).OrderByDescending(r=>r.MinistryId).Skip(skip).Take(50).Select(r=>new RecordRow(r.MinistryId,r.Name,"","",r.Description??"",0,r.CreatedDate,r.ContactNumber??"",r.MeetingLocation??"",TimeSpan.Zero,null,r.Status)).ToListAsync(),
            _=>await db.Events.AsNoTracking().Where(r=>r.CustomerId==c).OrderByDescending(r=>r.EventId).Skip(skip).Take(50).Select(r=>new RecordRow(r.EventId,r.Title,"",r.EventType,r.Description??"",0,r.EventDate,"",r.Venue??"",r.StartTime,r.EndTime,r.Status)).ToListAsync()
        };
        return Ok(rows);
    }
    [HttpPost("records/{kind}")]
    public Task<IActionResult> CreateRecord(string kind,RecordRequest request)=>SaveRecord(kind,0,request);
    [HttpPut("records/{kind}/{id:int}")]
    public async Task<IActionResult> SaveRecord(string kind,int id,RecordRequest request)
    {
        if(!RecordModules.TryGetValue(kind,out var module))return NotFound();
        var a=await Account(module);if(a==null)return Denied();
        if(id<0 || request.Date==default || string.IsNullOrWhiteSpace(request.Name))return BadRequest(new{message="A name and valid date are required."});
        if(!(id==0?await permissions.CanCreateAsync(a.ClientRoleId,a.CustomerId,module):await permissions.CanEditAsync(a.ClientRoleId,a.CustomerId,module)))return Denied();
        var c=a.CustomerId;
        if(request.PaymentMethod != null && !new[]{"CASH","BANK TRANSFER","GCASH","CHECK","CARD","OTHER"}.Contains(request.PaymentMethod))return BadRequest(new{message="Choose a valid payment method."});
        if(request.Status != null && !(kind=="events" ? new[]{"SCHEDULED","ONGOING","COMPLETED","CANCELLED"} : new[]{"ACTIVE","INACTIVE"}).Contains(request.Status))return BadRequest(new{message="Choose a valid status."});
        if(kind=="income") {
            if(request.Description.Length>250)return BadRequest(new{message="Income description must be at most 250 characters."});
            if(request.Name.Trim().Length>50)return BadRequest(new{message="Category must be at most 50 characters."});
            var row=id==0?new Income{CustomerId=c,PaymentMethod="CASH",RecordedBy=a.Username}:await db.Incomes.FirstOrDefaultAsync(r=>r.IncomeId==id&&r.CustomerId==c);if(row==null)return NotFound();
            row.Category=request.Name.Trim();row.Description=request.Description;row.Amount=request.Amount;if(request.PaymentMethod!=null)row.PaymentMethod=request.PaymentMethod;if(request.ReferenceNumber!=null)row.ReferenceNumber=request.ReferenceNumber;row.IncomeDate=request.Date.Date;if(id==0)db.Incomes.Add(row);
        } else if(kind=="expenses") {
            if(request.Name.Trim().Length>50)return BadRequest(new{message="Category must be at most 50 characters."});
            var row=id==0?new Expense{CustomerId=c,RecordedBy=a.Username}:await db.Expenses.FirstOrDefaultAsync(r=>r.ExpenseId==id&&r.CustomerId==c);if(row==null)return NotFound();
            row.Category=request.Name.Trim();row.Description=request.Description;row.Amount=request.Amount;if(request.PaymentMethod!=null)row.PaymentMethod=request.PaymentMethod;if(request.ReferenceNumber!=null)row.ReferenceNumber=request.ReferenceNumber;row.ExpenseDate=request.Date.Date;if(id==0)db.Expenses.Add(row);
        } else if(kind=="visitors") {
            if(string.IsNullOrWhiteSpace(request.LastName))return BadRequest(new{message="Last name is required."});
            var row=id==0?new Visitor{CustomerId=c,VisitorCode="V-"+Guid.NewGuid().ToString("N")}:await db.Visitors.FirstOrDefaultAsync(r=>r.VisitorId==id&&r.CustomerId==c);if(row==null)return NotFound();
            if(request.Status!=null)row.Status=request.Status;row.FirstName=request.Name.Trim();row.LastName=request.LastName.Trim();row.ContactNumber=request.Phone;row.Address=request.Location;row.Notes=request.Description;row.FirstVisitDate=request.Date.Date;if(id==0)db.Visitors.Add(row);
        } else if(kind=="ministries") {
            var row=id==0?new Ministry{CustomerId=c}:await db.Ministries.FirstOrDefaultAsync(r=>r.MinistryId==id&&r.CustomerId==c);if(row==null)return NotFound();
            if(request.Status!=null)row.Status=request.Status;row.Name=request.Name.Trim();row.ContactNumber=request.Phone;row.MeetingLocation=request.Location;row.Description=request.Description;row.UpdatedDate=DateTime.UtcNow;if(id==0)db.Ministries.Add(row);
        } else {
            if(request.StartTime<TimeSpan.Zero||request.StartTime>=TimeSpan.FromDays(1)||request.EndTime!=null&&(request.EndTime<=request.StartTime||request.EndTime>=TimeSpan.FromDays(1)))return BadRequest(new{message="End time must be after start time on the same day."});
            var row=id==0?new Event{CustomerId=c}:await db.Events.FirstOrDefaultAsync(r=>r.EventId==id&&r.CustomerId==c);if(row==null)return NotFound();
            if(request.Status!=null)row.Status=request.Status;row.Title=request.Name.Trim();row.EventType=request.Category;row.Description=request.Description;row.Venue=request.Location;row.EventDate=request.Date.Date;row.StartTime=request.StartTime;row.EndTime=request.EndTime;row.UpdatedAt=DateTime.UtcNow;if(id==0)db.Events.Add(row);
        }
        await db.SaveChangesAsync();return Ok(new{message="Record saved."});
    }
    [HttpDelete("records/{kind}/{id:int}")]
    public async Task<IActionResult> DeleteRecord(string kind,int id)
    {
        if(!RecordModules.TryGetValue(kind,out var module))return NotFound();var a=await Account(module);if(a==null||!await permissions.CanDeleteAsync(a.ClientRoleId,a.CustomerId,module))return Denied();
        object? row=kind switch {"income"=>await db.Incomes.FirstOrDefaultAsync(r=>r.IncomeId==id&&r.CustomerId==a.CustomerId),"expenses"=>await db.Expenses.FirstOrDefaultAsync(r=>r.ExpenseId==id&&r.CustomerId==a.CustomerId),"visitors"=>await db.Visitors.FirstOrDefaultAsync(r=>r.VisitorId==id&&r.CustomerId==a.CustomerId),"ministries"=>await db.Ministries.FirstOrDefaultAsync(r=>r.MinistryId==id&&r.CustomerId==a.CustomerId),_=>await db.Events.FirstOrDefaultAsync(r=>r.EventId==id&&r.CustomerId==a.CustomerId)};
        if(row==null)return NotFound();
        // Protect operational histories rather than cascading a directory deletion.
        if(row is Event ev) ev.Status="CANCELLED";
        else if(row is Ministry ministry) ministry.Status="INACTIVE";
        else if(row is Visitor visitor) visitor.Status="INACTIVE";
        else db.Remove(row);
        await db.SaveChangesAsync();return Ok(new{message=kind=="income"||kind=="expenses"?"Record deleted.":"Record made inactive; history retained."});
    }
}

