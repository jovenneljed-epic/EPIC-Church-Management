using System.Security.Claims;
using EPIC.Api.Data;
using EPIC.Api.Models;
using EPIC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers;

[ApiController, Authorize, Route("api/Community")]
public class CommunityController(ApplicationDbContext db) : ControllerBase
{
    private async Task<User?> Actor() {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("userId"), out var id)) return null;
        return await db.Users.AsNoTracking().Include(x => x.Role).Include(x => x.Member).SingleOrDefaultAsync(x => x.UserId == id && x.IsActive);
    }
    private static bool Member(User? u) => u?.Member?.Status == "ACTIVE" && (u.CustomerId == null || u.CustomerId == u.Member.CustomerId);
    private static bool Admin(User? u, int church) => u?.Role?.RoleName == "ADMIN" && (u.CustomerId == null || u.CustomerId == church);
    // Serialize writes within a church so moderation, blocking and interaction checks are atomic.
    private Task Lock(int church) => db.Database.ExecuteSqlInterpolatedAsync($@"DECLARE @r int; EXEC @r=sp_getapplock @Resource={$"EPIC:COMMUNITY:{church}"}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; IF @r < 0 THROW 51000, 'Community is busy. Please retry.', 1;");
    private IQueryable<int> VisibleMembers(User u) => db.Members.Where(m => m.CustomerId == u.Member!.CustomerId && m.Status == "ACTIVE" &&
        !db.CommunityBlocks.Any(b => (b.MemberId == u.MemberId && b.BlockedMemberId == m.MemberId) || (b.MemberId == m.MemberId && b.BlockedMemberId == u.MemberId))).Select(m => m.MemberId);
    private IQueryable<CommunityContent> Visible(User u) {
        var ids = VisibleMembers(u);
        var approved = db.CommunityContent.Where(c => c.CustomerId == u.Member!.CustomerId && c.Status == "APPROVED" && ids.Contains(c.MemberId));
        return approved.Where(c => c.SharedPostId == null || approved.Any(s => s.Id == c.SharedPostId && s.Kind == "POST" && s.SharedPostId == null));
    }
    private async Task<object> ProfileData(int id) {
        var m = await db.Members.AsNoTracking().Where(m => m.MemberId == id).Select(m => new { m.MemberId, name = m.FirstName + " " + (m.MiddleName == null ? "" : m.MiddleName + " ") + m.LastName }).SingleAsync();
        var photoId = await db.CommunityContent.Where(c => c.MemberId == id && c.Kind == "PHOTO" && c.Status == "APPROVED").Select(c => (int?)c.Id).FirstOrDefaultAsync();
        return new { m.MemberId, m.name, photoId };
    }
    [HttpGet("me")]
    public async Task<IActionResult> Me() {
        var u = await Actor(); if (!Member(u)) return Forbid();
        return Ok(new { profile = await ProfileData(u!.MemberId!.Value), photoSubmission = await db.CommunityContent.Where(c => c.MemberId == u.MemberId && c.Kind == "PHOTO" && c.Status != "REMOVED").OrderByDescending(c => c.Id).Select(c => new { c.Id, c.Status, c.ReviewReason }).FirstOrDefaultAsync() });
    }
    [HttpGet("profiles/{id:int}")]
    public async Task<IActionResult> Profile(int id) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        if (!await VisibleMembers(u!).ContainsAsync(id)) return NotFound();
        return Ok(await ProfileData(id));
    }
    [HttpGet("members")]
    public async Task<IActionResult> Members(string search = "", int after = 0) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        search = (search ?? "").Trim(); if (search.Length > 100) return BadRequest();
        var ids = VisibleMembers(u!);
        return Ok(await db.Members.Where(m => ids.Contains(m.MemberId) && m.MemberId > after && (search == "" || m.FirstName.Contains(search) || m.LastName.Contains(search)))
            .OrderBy(m => m.MemberId).Take(30).Select(m => new { m.MemberId, name = m.FirstName + " " + m.LastName }).ToListAsync());
    }
    private async Task<object> Card(CommunityContent c, User u, bool moderation = false) {
        var allowed = Member(u) ? VisibleMembers(u) : db.Members.Select(m => m.MemberId);
        var reactions = await db.CommunityReactions.Where(r => r.PostId == c.Id && allowed.Contains(r.MemberId)).GroupBy(r => r.Kind).Select(g => new { kind = g.Key, count = g.Count() }).ToListAsync();
        object? shared = null;
        if (c.SharedPostId != null) {
            var s = await db.CommunityContent.AsNoTracking().SingleOrDefaultAsync(x => x.Id == c.SharedPostId);
            if (s != null) shared = new { s.Id, s.Body, s.Category, s.Status, author = await ProfileData(s.MemberId) };
        }
        return new { c.Id, c.Kind, c.Category, c.Body, c.Status, c.ParentId, c.SharedPostId, c.CreatedAt,
            reviewReason = moderation || c.MemberId == u.MemberId ? c.ReviewReason : "", author = await ProfileData(c.MemberId),
            photoId = c.Kind == "PHOTO" ? (int?)c.Id : null, isMine = c.MemberId == u.MemberId, shared, reactions,
            myReaction = await db.CommunityReactions.Where(r => r.PostId == c.Id && r.MemberId == u.MemberId).Select(r => r.Kind).SingleOrDefaultAsync() };
    }
    [HttpGet("feed")]
    public async Task<IActionResult> Feed(int? memberId = null, int before = 0) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        if (memberId != null && !await VisibleMembers(u!).ContainsAsync(memberId.Value)) return NotFound();
        var visible = Visible(u!).Select(c => c.Id);
        var rows = await db.CommunityContent.AsNoTracking().Where(c => c.Kind == "POST" && (memberId == null || c.MemberId == memberId) && (before == 0 || c.Id < before) &&
            (visible.Contains(c.Id) || (memberId == u!.MemberId && c.MemberId == u.MemberId && c.SharedPostId == null && (c.Status == "PENDING" || c.Status == "REJECTED")) ||
            (memberId == u!.MemberId && c.MemberId == u.MemberId && (c.Status == "PENDING" || c.Status == "REJECTED") && visible.Contains(c.SharedPostId!.Value))))
            .OrderByDescending(c => c.Id).Take(20).ToListAsync();
        var result = new List<object>(); foreach (var c in rows) result.Add(await Card(c, u!));
        return Ok(result);
    }
    [HttpGet("posts/{id:int}/comments")]
    public async Task<IActionResult> Comments(int id, int before = 0) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        if (!await Visible(u!).AnyAsync(c => c.Id == id && c.Kind == "POST")) return NotFound();
        var ids = VisibleMembers(u!);
        var rows = await db.CommunityContent.AsNoTracking().Where(c => c.ParentId == id && c.Kind == "COMMENT" && ids.Contains(c.MemberId) && (c.Status == "APPROVED" || (c.MemberId == u!.MemberId && (c.Status == "PENDING" || c.Status == "REJECTED"))) && (before == 0 || c.Id < before)).OrderByDescending(c => c.Id).Take(30).ToListAsync();
        var result = new List<object>(); foreach (var c in rows) result.Add(await Card(c, u!)); return Ok(result);
    }
    public record SubmitRequest(string Body, string Category, string ClientRequestId, int? ParentId = null, int? SharedPostId = null);
    [HttpPost("posts")]
    public async Task<IActionResult> Submit(SubmitRequest r) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        var body = r.Body?.Trim() ?? ""; var category = r.Category?.ToUpperInvariant();
        if (r.ClientRequestId?.Length is not (> 0 and <= 80) || body.Length > (r.ParentId == null ? 2000 : 1000) || (body.Length == 0 && r.SharedPostId == null) ||
            category is not ("SCRIPTURE" or "ENCOURAGEMENT" or "TESTIMONY" or "GRATITUDE") || (r.ParentId != null && r.SharedPostId != null))
            return BadRequest(new { message = "Choose a topic and write an encouraging message (posts: 2,000 characters; comments: 1,000)." });
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(u!.Member!.CustomerId);
        var existing = await db.CommunityContent.SingleOrDefaultAsync(c => c.MemberId == u.MemberId && c.ClientRequestId == r.ClientRequestId);
        if (existing != null) {
            if (existing.Kind != (r.ParentId == null ? "POST" : "COMMENT") || existing.Body != body || existing.Category != category || existing.ParentId != r.ParentId)
                return Conflict(new { message = "This submission ID was already used. Start a new submission for different content." });
            return Ok(new { existing.Id, existing.Status });
        }
        var policyError = CommunityTextPolicy.Check(body);
        if (policyError != null) return BadRequest(new { message = policyError });
        if (r.ParentId != null && !await Visible(u).AnyAsync(c => c.Id == r.ParentId && c.Kind == "POST")) return NotFound();
        int? sharedId = r.SharedPostId;
        if (sharedId != null) {
            var source = await Visible(u).SingleOrDefaultAsync(c => c.Id == sharedId && c.Kind == "POST"); if (source == null) return NotFound();
            sharedId = source.SharedPostId ?? source.Id;
        }
        var kind = r.ParentId == null ? "POST" : "COMMENT";
        var since = DateTime.UtcNow.AddMinutes(-1);
        if (await db.CommunityContent.CountAsync(c => c.MemberId == u.MemberId && c.Kind == kind && c.CreatedAt > since) >= (kind == "POST" ? 5 : 10)) return StatusCode(429, new { message = "You're posting quickly. Please wait a minute and try again." });
        // APPROVED is the existing storage value for published content; no human approval is required for text.
        var content = new CommunityContent { CustomerId = u.Member.CustomerId, MemberId = u.MemberId!.Value, Body = body, Category = category, Kind = kind, ParentId = r.ParentId, SharedPostId = sharedId, ClientRequestId = r.ClientRequestId, Status = "APPROVED" };
        db.CommunityContent.Add(content); await db.SaveChangesAsync(); await tx.CommitAsync(); return Ok(new { content.Id, content.Status });
    }
    public record PhotoRequest(string Base64, string ClientRequestId);
    [HttpPost("photos"), RequestSizeLimit(4000000)]
    public async Task<IActionResult> Upload(PhotoRequest r) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        if (r.ClientRequestId?.Length is not (> 0 and <= 80)) return BadRequest();
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(u!.Member!.CustomerId);
        var existing = await db.CommunityContent.SingleOrDefaultAsync(c => c.MemberId == u.MemberId && c.ClientRequestId == r.ClientRequestId);
        if (existing != null) return existing.Kind == "PHOTO" ? Ok(new { existing.Id, existing.Status }) : Conflict(new { message = "This submission ID was already used." });
        var since = DateTime.UtcNow.AddDays(-1);
        if (await db.CommunityContent.CountAsync(c => c.MemberId == u.MemberId && c.Kind == "PHOTO" && c.CreatedAt > since) >= 5) return StatusCode(429, new { message = "You can submit up to five photos per day." });
        byte[] photo; try { photo = CommunityPhotoService.Normalize(r.Base64); } catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
        foreach (var old in await db.CommunityContent.Where(c => c.MemberId == u.MemberId && c.Kind == "PHOTO" && c.Status == "PENDING").ToListAsync()) { old.Status = "REMOVED"; old.Photo = null; }
        var c = new CommunityContent { MemberId = u.MemberId!.Value, CustomerId = u.Member.CustomerId, Kind = "PHOTO", Photo = photo, ClientRequestId = r.ClientRequestId };
        db.CommunityContent.Add(c); await db.SaveChangesAsync(); await tx.CommitAsync(); return Ok(new { c.Id, c.Status });
    }
    [HttpGet("photos/{id:int}")]
    public async Task<IActionResult> Photo(int id) {
        var u = await Actor(); if (u == null) return Forbid();
        var c = await db.CommunityContent.AsNoTracking().SingleOrDefaultAsync(c => c.Id == id && c.Kind == "PHOTO" && c.Status != "REMOVED");
        if (c?.Photo == null) return NotFound();
        if (!Admin(u, c.CustomerId) && (!Member(u) || (!await Visible(u).AnyAsync(x => x.Id == id) && c.MemberId != u.MemberId))) return NotFound();
        Response.Headers.CacheControl = "private, no-store"; Response.Headers.XContentTypeOptions = "nosniff";
        return File(c.Photo, "image/jpeg");
    }
    [HttpDelete("content/{id:int}")]
    public async Task<IActionResult> Delete(int id) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(u!.Member!.CustomerId);
        var c = await db.CommunityContent.SingleOrDefaultAsync(c => c.Id == id && c.MemberId == u.MemberId); if (c == null) return NotFound();
        c.Status = "REMOVED"; c.Photo = null; await db.SaveChangesAsync(); await tx.CommitAsync(); return NoContent();
    }
    public record ReactionRequest(string Kind);
    [HttpPut("posts/{id:int}/reaction")]
    public async Task<IActionResult> React(int id, ReactionRequest r) => await Reaction(id, r.Kind);
    [HttpDelete("posts/{id:int}/reaction")]
    public async Task<IActionResult> Unreact(int id) => await Reaction(id, null);
    private async Task<IActionResult> Reaction(int id, string? kind) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        if (kind != null && kind is not ("LIKE" or "LOVE" or "AMEN" or "PRAY" or "ENCOURAGE")) return BadRequest();
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(u!.Member!.CustomerId);
        if (!await Visible(u).AnyAsync(c => c.Id == id && c.Kind == "POST")) return NotFound();
        var r = await db.CommunityReactions.SingleOrDefaultAsync(r => r.PostId == id && r.MemberId == u.MemberId);
        if (kind == null) { if (r != null) db.CommunityReactions.Remove(r); }
        else if (r == null) db.CommunityReactions.Add(new CommunityReaction { PostId = id, MemberId = u.MemberId!.Value, Kind = kind }); else r.Kind = kind;
        await db.SaveChangesAsync(); await tx.CommitAsync(); return NoContent();
    }
    [HttpGet("blocks")]
    public async Task<IActionResult> Blocks() {
        var u = await Actor(); if (!Member(u)) return Forbid();
        return Ok(await (from b in db.CommunityBlocks join m in db.Members on b.BlockedMemberId equals m.MemberId where b.MemberId == u!.MemberId select new { m.MemberId, name = m.FirstName + " " + m.LastName }).ToListAsync());
    }
    [HttpPut("blocks/{id:int}")]
    public async Task<IActionResult> Block(int id) => await SetBlock(id, true);
    [HttpDelete("blocks/{id:int}")]
    public async Task<IActionResult> Unblock(int id) => await SetBlock(id, false);
    private async Task<IActionResult> SetBlock(int id, bool blocked) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        if (id == u!.MemberId || !await db.Members.AnyAsync(m => m.MemberId == id && m.CustomerId == u.Member!.CustomerId)) return NotFound();
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(u.Member!.CustomerId);
        var b = await db.CommunityBlocks.SingleOrDefaultAsync(b => b.MemberId == u.MemberId && b.BlockedMemberId == id);
        if (blocked && b == null) db.CommunityBlocks.Add(new CommunityBlock { MemberId = u.MemberId!.Value, BlockedMemberId = id });
        if (!blocked && b != null) db.CommunityBlocks.Remove(b);
        await db.SaveChangesAsync(); await tx.CommitAsync(); return NoContent();
    }
    public record ReportRequest(string Reason);
    [HttpPost("content/{id:int}/report")]
    public async Task<IActionResult> Report(int id, ReportRequest r) {
        var u = await Actor(); if (!Member(u)) return Forbid();
        if (string.IsNullOrWhiteSpace(r.Reason) || r.Reason.Length > 500) return BadRequest(new { message = "Please explain the concern in up to 500 characters." });
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(u!.Member!.CustomerId);
        var content = await Visible(u).SingleOrDefaultAsync(c => c.Id == id);
        if (content == null || (content.ParentId != null && !await Visible(u).AnyAsync(c => c.Id == content.ParentId))) return NotFound();
        var report = await db.CommunityReports.SingleOrDefaultAsync(x => x.ContentId == id && x.MemberId == u.MemberId);
        if (report != null) return NoContent();
        var since = DateTime.UtcNow.AddDays(-1);
        if (await db.CommunityReports.CountAsync(x => x.MemberId == u.MemberId && x.CreatedAt > since) >= 10) return StatusCode(429, new { message = "Daily report limit reached." });
        db.CommunityReports.Add(new CommunityReport { CustomerId = u.Member.CustomerId, ContentId = id, MemberId = u.MemberId!.Value, Reason = r.Reason.Trim() });
        await db.SaveChangesAsync(); await tx.CommitAsync(); return NoContent();
    }
    [HttpGet("admin-profile")]
    public async Task<IActionResult> AdminProfile() {
        var u = await Actor(); if (u?.Role?.RoleName != "ADMIN") return Forbid();
        var content = db.CommunityContent.Where(c => u.CustomerId == null || c.CustomerId == u.CustomerId);
        return Ok(new {
            u.UserId, name = u.FullName, role = "Church administrator",
            church = u.CustomerId == null ? "System administrator · All churches" : await db.Customers.Where(c => c.CustomerId == u.CustomerId).Select(c => c.ChurchName).SingleOrDefaultAsync(),
            memberProfile = Member(u) ? await ProfileData(u.MemberId!.Value) : null,
            pending = await content.CountAsync(c => c.Kind == "PHOTO" && c.Status == "PENDING"),
            reports = await db.CommunityReports.CountAsync(r => !r.IsResolved && (u.CustomerId == null || r.CustomerId == u.CustomerId))
        });
    }
    [HttpGet("admin/members")]
    public async Task<IActionResult> AdminMembers(string search = "", int after = 0) {
        var u = await Actor(); if (u?.Role?.RoleName != "ADMIN") return Forbid();
        search = (search ?? "").Trim(); if (search.Length > 100) return BadRequest();
        return Ok(await db.Members.AsNoTracking().Where(m => m.Status == "ACTIVE" && (u.CustomerId == null || m.CustomerId == u.CustomerId) && m.MemberId > after &&
            (search == "" || (m.FirstName + " " + m.LastName).Contains(search) || m.FirstName.Contains(search) || m.LastName.Contains(search)))
            .OrderBy(m => m.MemberId).Take(30).Select(m => new { m.MemberId, name = m.FirstName + " " + m.LastName, church = db.Customers.Where(c => c.CustomerId == m.CustomerId).Select(c => c.ChurchName).FirstOrDefault() }).ToListAsync());
    }
    [HttpGet("admin/members/{id:int}")]
    public async Task<IActionResult> AdminMemberProfile(int id) {
        var u = await Actor(); if (u?.Role?.RoleName != "ADMIN") return Forbid();
        if (!await db.Members.AnyAsync(m => m.MemberId == id && m.Status == "ACTIVE" && (u.CustomerId == null || m.CustomerId == u.CustomerId))) return NotFound();
        return Ok(await ProfileData(id));
    }
    [HttpGet("moderation")]
    public async Task<IActionResult> Queue(string kind = "POST", int after = 0, int? memberId = null) {
        var u = await Actor(); if (u?.Role?.RoleName != "ADMIN") return Forbid();
        if (memberId != null && !await db.Members.AnyAsync(m => m.MemberId == memberId && m.Status == "ACTIVE" && (u.CustomerId == null || m.CustomerId == u.CustomerId))) return NotFound();
        if (kind is not ("POST" or "COMMENT" or "PHOTO" or "REPORTS" or "PUBLISHED")) return BadRequest();
        var reported = kind == "REPORTS";
        var published = db.CommunityContent.Where(c => c.Status == "APPROVED" && db.Members.Any(m => m.MemberId == c.MemberId && m.Status == "ACTIVE" && m.CustomerId == c.CustomerId));
        var publishedPosts = published.Where(c => c.Kind == "POST" && (c.SharedPostId == null || published.Any(s => s.Id == c.SharedPostId && s.Kind == "POST" && s.SharedPostId == null)));
        var query = db.CommunityContent.AsNoTracking().Where(c => (u.CustomerId == null || c.CustomerId == u.CustomerId) && (memberId == null || c.MemberId == memberId) && (kind == "PUBLISHED" ? after == 0 || c.Id < after : c.Id > after) &&
            (reported ? db.CommunityReports.Any(r => r.ContentId == c.Id && !r.IsResolved) : kind == "PUBLISHED" ?
                (publishedPosts.Any(p => p.Id == c.Id) || (c.Kind == "COMMENT" && published.Any(p => p.Id == c.Id) && publishedPosts.Any(p => p.Id == c.ParentId))) :
                c.Kind == kind && c.Status == "PENDING"));
        var rows = await (kind == "PUBLISHED" ? query.OrderByDescending(c => c.Id) : query.OrderBy(c => c.Id)).Take(20).ToListAsync();
        var result = new List<object>(); foreach (var c in rows) {
            var parent = c.ParentId == null ? null : await db.CommunityContent.Where(p => p.Id == c.ParentId).Select(p => new { p.Body, p.Status }).SingleOrDefaultAsync();
            result.Add(new { content = await Card(c, u, true), parent, church = await db.Customers.Where(x => x.CustomerId == c.CustomerId).Select(x => x.ChurchName).SingleAsync(),
                reports = await db.CommunityReports.Where(r => r.ContentId == c.Id && !r.IsResolved).Select(r => new { r.Id, r.Reason, r.CreatedAt }).ToListAsync() });
        } return Ok(result);
    }
    public record ReviewRequest(string Decision, string ExpectedStatus, string Reason);
    [HttpPut("moderation/{id:int}")]
    public async Task<IActionResult> Review(int id, ReviewRequest r) {
        var u = await Actor(); var church = await db.CommunityContent.Where(c => c.Id == id).Select(c => (int?)c.CustomerId).SingleOrDefaultAsync();
        if (church == null) return NotFound(); if (!Admin(u, church.Value)) return Forbid();
        if (r.Decision is not ("APPROVED" or "REJECTED" or "REMOVED" or "REPORT_DISMISSED") || (r.Reason?.Length ?? 0) > 500 || (r.Decision != "APPROVED" && string.IsNullOrWhiteSpace(r.Reason))) return BadRequest(new { message = "Include a reason for this decision (up to 500 characters)." });
        await using var tx = await db.Database.BeginTransactionAsync(); await Lock(church.Value);
        var c = await db.CommunityContent.SingleAsync(c => c.Id == id);
        if (c.Status != r.ExpectedStatus) return Conflict(new { message = "This item changed. Refresh before reviewing." });
        if (c.Kind != "PHOTO" && r.Decision is "APPROVED" or "REJECTED") return BadRequest(new { message = "Text posts publish immediately. Use removal to moderate published text." });
        if (r.Decision is "APPROVED" or "REJECTED" && c.Status != "PENDING") return Conflict(new { message = "Only pending submissions can be approved or rejected." });
        if (r.Decision == "APPROVED") {
            if (!await db.Members.AnyAsync(m => m.MemberId == c.MemberId && m.CustomerId == c.CustomerId && m.Status == "ACTIVE")) return BadRequest(new { message = "The author is no longer an active member." });
            foreach (var target in new[] { c.ParentId, c.SharedPostId }.Where(x => x != null))
                if (!await db.CommunityContent.AnyAsync(p => p.Id == target && p.CustomerId == c.CustomerId && p.Kind == "POST" && p.Status == "APPROVED")) return BadRequest(new { message = "The original post is no longer published." });
            if (c.Kind == "PHOTO") foreach (var old in await db.CommunityContent.Where(p => p.MemberId == c.MemberId && p.Kind == "PHOTO" && p.Status == "APPROVED").ToListAsync()) { old.Status = "REMOVED"; old.Photo = null; }
        }
        if (r.Decision != "REPORT_DISMISSED") { c.Status = r.Decision; c.ReviewReason = r.Reason?.Trim() ?? ""; c.ReviewedAt = DateTime.UtcNow; c.ReviewedByUserId = u!.UserId; if (c.Status == "REMOVED") c.Photo = null; }
        foreach (var report in await db.CommunityReports.Where(x => x.ContentId == id && !x.IsResolved).ToListAsync()) report.IsResolved = true;
        db.CommunityReviews.Add(new CommunityReview { ContentId = id, ReviewerUserId = u!.UserId, Decision = r.Decision, Reason = r.Reason?.Trim() ?? "" });
        await db.SaveChangesAsync(); await tx.CommitAsync(); return NoContent();
    }
}
