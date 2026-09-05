using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EPIC.Api.Data;
using EPIC.Api.Models;

namespace EPIC.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnnouncementsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnnouncementsController(
        ApplicationDbContext context)
    {
        _context = context;
    }


    // GET: api/announcements
    // Public website access
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Announcement>>> GetAnnouncements()
    {
        var announcements = await _context.Announcements
            .Where(x => x.IsPublished)
            .OrderByDescending(x => x.PublishDate)
            .ToListAsync();

        return Ok(announcements);
    }



    // GET: api/announcements/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Announcement>> GetAnnouncement(int id)
    {
        var announcement = await _context.Announcements
            .FirstOrDefaultAsync(x => x.Id == id);

        if (announcement == null)
        {
            return NotFound();
        }

        return Ok(announcement);
    }



    // POST: api/announcements
    // Admin only
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Announcement>> CreateAnnouncement(
        Announcement announcement)
    {
        announcement.CreatedDate = DateTime.UtcNow;

        _context.Announcements.Add(announcement);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAnnouncement),
            new { id = announcement.Id },
            announcement
        );
    }



    // PUT: api/announcements/5
    // Admin only
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAnnouncement(
        int id,
        Announcement announcement)
    {
        if (id != announcement.Id)
        {
            return BadRequest();
        }


        var existing =
            await _context.Announcements
            .FirstOrDefaultAsync(x => x.Id == id);


        if (existing == null)
        {
            return NotFound();
        }


        existing.Title = announcement.Title;
        existing.Content = announcement.Content;
        existing.Category = announcement.Category;
        existing.ImageUrl = announcement.ImageUrl;
        existing.IsPublished = announcement.IsPublished;
        existing.PublishDate = announcement.PublishDate;


        await _context.SaveChangesAsync();

        return NoContent();
    }



    // DELETE: api/announcements/5
    // Admin only
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAnnouncement(int id)
    {
        var announcement =
            await _context.Announcements
            .FirstOrDefaultAsync(x => x.Id == id);


        if (announcement == null)
        {
            return NotFound();
        }


        _context.Announcements.Remove(announcement);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}