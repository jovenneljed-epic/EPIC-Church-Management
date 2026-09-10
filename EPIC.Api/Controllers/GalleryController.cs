using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EPIC.Api.Data;
using EPIC.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EPIC.Api.Controllers
{
    [ApiController]
    [Route("api/gallery")]
    public class GalleryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static bool _tableEnsured = false;
        private static readonly object _tableLock = new object();

        public GalleryController(ApplicationDbContext context)
        {
            _context = context;
            EnsureTableCreated();
        }

        private void EnsureTableCreated()
        {
            if (_tableEnsured) return;
            lock (_tableLock)
            {
                if (_tableEnsured) return;
                try
                {
                    const string sql = @"
                        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GalleryItems')
                        BEGIN
                            CREATE TABLE GalleryItems (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                Title NVARCHAR(250) NOT NULL,
                                Description NVARCHAR(MAX) NOT NULL,
                                ImageUrl NVARCHAR(MAX) NOT NULL,
                                Category NVARCHAR(50) NOT NULL DEFAULT 'WORSHIP',
                                EventLocation NVARCHAR(150) NOT NULL DEFAULT 'Main Sanctuary',
                                CapturedBy NVARCHAR(150) NOT NULL DEFAULT 'EPIC Media Team',
                                Badge NVARCHAR(50) NOT NULL DEFAULT 'MOMENT',
                                Likes INT NOT NULL DEFAULT 0,
                                CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                            );
                            CREATE INDEX IX_GalleryItems_Category ON GalleryItems(Category);
                            CREATE INDEX IX_GalleryItems_CreatedDate ON GalleryItems(CreatedDate);
                        END;
                    ";
                    _context.Database.ExecuteSqlRaw(sql);
                    _tableEnsured = true;
                }
                catch
                {
                    // Fallback if permission or context issue
                }
            }
        }

        // ==========================================
        // GET ALL GALLERY MOMENTS & PHOTO STORIES
        // GET /api/gallery
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetGalleryItems()
        {
            var items = await _context.GalleryItems
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ToListAsync();

            // If completely empty on first launch, auto-seed curated moments
            if (items.Count == 0)
            {
                var seeded = SeedInitialCuratedStories();
                _context.GalleryItems.AddRange(seeded);
                await _context.SaveChangesAsync();
                items = seeded.OrderByDescending(x => x.CreatedDate).ToList();
            }

            return Ok(items);
        }

        // ==========================================
        // SUBMIT PHOTO STORY
        // POST /api/gallery
        // ==========================================
        [HttpPost]
        public async Task<IActionResult> CreateGalleryItem([FromBody] CreateGalleryStoryDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.ImageUrl) || string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest("Title and Image are required for a photo story.");
            }

            var item = new GalleryItem
            {
                Title = dto.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? "Captured moment in ministry." : dto.Description.Trim(),
                ImageUrl = dto.ImageUrl.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "WORSHIP" : dto.Category.ToUpperInvariant(),
                EventLocation = string.IsNullOrWhiteSpace(dto.EventLocation) ? "Main Sanctuary" : dto.EventLocation.Trim(),
                CapturedBy = string.IsNullOrWhiteSpace(dto.CapturedBy) ? "Church Member" : dto.CapturedBy.Trim(),
                Badge = string.IsNullOrWhiteSpace(dto.Badge) ? "MOMENT" : dto.Badge.ToUpperInvariant(),
                Likes = 1,
                CreatedDate = DateTime.UtcNow
            };

            _context.GalleryItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(item);
        }

        // ==========================================
        // LIKE PHOTO STORY
        // POST /api/gallery/{id}/like
        // ==========================================
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikeGalleryItem(int id)
        {
            var item = await _context.GalleryItems.FindAsync(id);
            if (item == null)
            {
                return NotFound("Gallery moment not found.");
            }

            item.Likes++;
            await _context.SaveChangesAsync();

            return Ok(new { id = item.Id, likes = item.Likes });
        }

        private static List<GalleryItem> SeedInitialCuratedStories()
        {
            return new List<GalleryItem>
            {
                new GalleryItem
                {
                    Title = "Sunday Expository Worship & Congregation-Wide Intercession",
                    Description = "Over 450 believers filled the sanctuary with unreserved praise as the worship team and pastor Aviguetero ushered the congregation into deep prayer.",
                    ImageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80",
                    Category = "WORSHIP",
                    EventLocation = "Main Sanctuary",
                    CapturedBy = "Brother Daniel (Media Team)",
                    Badge = "FEATURED STORY",
                    Likes = 68,
                    CreatedDate = DateTime.UtcNow.AddHours(-3)
                },
                new GalleryItem
                {
                    Title = "Express Mobile QR Check-In Kiosks Greeting Sanctuary Entrances",
                    Description = "Sanctuary greeters verify member attendance and welcome first-time families in under 2 seconds with tablet QR scanning synchronized with pastoral analytics.",
                    ImageUrl = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80",
                    Category = "TECHNOLOGY",
                    EventLocation = "North & South Entrances",
                    CapturedBy = "IT Operations Team",
                    Badge = "TECH SPOTLIGHT",
                    Likes = 52,
                    CreatedDate = DateTime.UtcNow.AddHours(-7)
                },
                new GalleryItem
                {
                    Title = "Youth Encounter 2026: 'Unstoppable Generation' Bonfire Rally",
                    Description = "High school and collegiate youth gathered for an unforgettable night of acoustic worship, surrender prayer, and testimonies around the fire.",
                    ImageUrl = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80",
                    Category = "YOUTH",
                    EventLocation = "Camp Sinai Grounds",
                    CapturedBy = "Youth Media Crew",
                    Badge = "BREAKING STORY",
                    Likes = 94,
                    CreatedDate = DateTime.UtcNow.AddDays(-1)
                },
                new GalleryItem
                {
                    Title = "Midweek Discipleship & Life Group Scripture Circles",
                    Description = "Believers gather in warm home altars and fellowship halls, opening God's Word together with the EPIC Academy discipleship curriculum.",
                    ImageUrl = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
                    Category = "DISCIPLESHIP",
                    EventLocation = "Fellowship Hall A",
                    CapturedBy = "Sister Grace Villanueva",
                    Badge = "COMMUNITY CHRONICLE",
                    Likes = 41,
                    CreatedDate = DateTime.UtcNow.AddDays(-2)
                },
                new GalleryItem
                {
                    Title = "Community Medical Compassion Mission: Serving 500+ Barangay Families",
                    Description = "Doctor volunteers, nurses, and church servants distributed free pediatric consultations, dental hygiene kits, and grocery packs to local families.",
                    ImageUrl = "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80",
                    Category = "OUTREACH",
                    EventLocation = "Barangay San Jose Covered Court",
                    CapturedBy = "Outreach Compassion Team",
                    Badge = "MISSION DISPATCH",
                    Likes = 83,
                    CreatedDate = DateTime.UtcNow.AddDays(-3)
                },
                new GalleryItem
                {
                    Title = "Public Water Baptism: 28 New Disciples Boldly Profess Christ",
                    Description = "Tears of joy and thunderous applause echoed across the courtyard pool as 28 believers took the sacred step of water baptism following Foundations Track 101.",
                    ImageUrl = "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1600&q=80",
                    Category = "WORSHIP",
                    EventLocation = "Courtyard Baptismal Pool",
                    CapturedBy = "Pastoral Staff",
                    Badge = "PRAISE REPORT",
                    Likes = 112,
                    CreatedDate = DateTime.UtcNow.AddDays(-4)
                },
                new GalleryItem
                {
                    Title = "Kids Faith Explorers: Action Praise and Scripture Memory Masters",
                    Description = "Children worshipping with pure joy, memorizing Psalm 119:105, and building craft models of Noah's Ark with loving Sunday school teachers.",
                    ImageUrl = "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1600&q=80",
                    Category = "FAMILY",
                    EventLocation = "Kids Zone Sanctuary",
                    CapturedBy = "Children's Ministry",
                    Badge = "MOMENT",
                    Likes = 59,
                    CreatedDate = DateTime.UtcNow.AddDays(-5)
                },
                new GalleryItem
                {
                    Title = "Broadcast Control Booth: Multicam Streaming & High-Definition Audio",
                    Description = "Behind-the-scenes look at the technical media volunteers mixing audio stems, directing robotic PTZ cameras, and broadcasting live worldwide.",
                    ImageUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1600&q=80",
                    Category = "TECHNOLOGY",
                    EventLocation = "Media Production Mezzanine",
                    CapturedBy = "Tech Operations",
                    Badge = "BEHIND THE SCENES",
                    Likes = 47,
                    CreatedDate = DateTime.UtcNow.AddDays(-6)
                }
            };
        }
    }

    public class CreateGalleryStoryDto
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string ImageUrl { get; set; } = "";
        public string Category { get; set; } = "WORSHIP";
        public string EventLocation { get; set; } = "Main Sanctuary";
        public string CapturedBy { get; set; } = "Church Member";
        public string Badge { get; set; } = "MOMENT";
    }
}
