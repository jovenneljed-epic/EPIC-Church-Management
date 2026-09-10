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
    [Route("api/public-community")]
    public class PublicCommunityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static bool _tablesEnsured = false;
        private static readonly object _tableLock = new object();

        public PublicCommunityController(ApplicationDbContext context)
        {
            _context = context;
            EnsureTablesCreated();
        }

        private void EnsureTablesCreated()
        {
            if (_tablesEnsured) return;
            lock (_tableLock)
            {
                if (_tablesEnsured) return;
                try
                {
                    const string sql = @"
                        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PublicCommunityPosts')
                        BEGIN
                            CREATE TABLE PublicCommunityPosts (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                AuthorName NVARCHAR(150) NOT NULL,
                                AuthorRole NVARCHAR(100) NOT NULL DEFAULT 'Church Member',
                                AvatarBg NVARCHAR(50) NOT NULL DEFAULT '#0284c7',
                                PostType NVARCHAR(50) NOT NULL DEFAULT 'ENCOURAGEMENT',
                                MinistryGroup NVARCHAR(100) NOT NULL DEFAULT 'General',
                                Title NVARCHAR(250) NULL,
                                Content NVARCHAR(MAX) NOT NULL,
                                ScriptureRef NVARCHAR(150) NULL,
                                MediaUrl NVARCHAR(MAX) NULL,
                                EncouragesCount INT NOT NULL DEFAULT 0,
                                PrayingCount INT NOT NULL DEFAULT 0,
                                StrengthenedCount INT NOT NULL DEFAULT 0,
                                CelebratesCount INT NOT NULL DEFAULT 0,
                                CommentsCount INT NOT NULL DEFAULT 0,
                                CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                            );
                            CREATE INDEX IX_PublicCommunityPosts_Type ON PublicCommunityPosts(PostType);
                            CREATE INDEX IX_PublicCommunityPosts_Created ON PublicCommunityPosts(CreatedAt);
                        END;

                        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PublicCommunityComments')
                        BEGIN
                            CREATE TABLE PublicCommunityComments (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                PostId INT NOT NULL,
                                AuthorName NVARCHAR(150) NOT NULL,
                                AvatarBg NVARCHAR(50) NOT NULL DEFAULT '#0284c7',
                                Content NVARCHAR(MAX) NOT NULL,
                                CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                            );
                            CREATE INDEX IX_PublicCommunityComments_Post ON PublicCommunityComments(PostId);
                        END;

                        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PublicCommunityReactions')
                        BEGIN
                            CREATE TABLE PublicCommunityReactions (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                PostId INT NOT NULL,
                                UserToken NVARCHAR(100) NOT NULL,
                                ReactionType NVARCHAR(50) NOT NULL,
                                CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                            );
                            CREATE INDEX IX_PublicCommunityReactions_PostUser ON PublicCommunityReactions(PostId, UserToken);
                        END;

                        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PublicCommunityPrayers')
                        BEGIN
                            CREATE TABLE PublicCommunityPrayers (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                PostId INT NOT NULL,
                                UserToken NVARCHAR(100) NOT NULL,
                                PrayedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                            );
                            CREATE INDEX IX_PublicCommunityPrayers_PostUser ON PublicCommunityPrayers(PostId, UserToken);
                        END;
                    ";
                    _context.Database.ExecuteSqlRaw(sql);
                    SeedInitialPostsIfEmpty();
                    _tablesEnsured = true;
                }
                catch
                {
                    // Fail-safe
                }
            }
        }

        private void SeedInitialPostsIfEmpty()
        {
            try
            {
                if (!_context.PublicCommunityPosts.Any())
                {
                    var seeds = new List<PublicCommunityPost>
                    {
                        new PublicCommunityPost
                        {
                            AuthorName = "Sister Grace Villanueva",
                            AuthorRole = "Outreach Compassion Servant",
                            AvatarBg = "#059669",
                            PostType = "PRAYER",
                            MinistryGroup = "Outreach Ministry",
                            Title = "Intercession for Community Medical & Grocery Mission",
                            Content = "Please join us in prayer for our upcoming Medical Aid Mission in Barangay San Jose this Saturday. We are expecting over 400 families. Pray for fair weather, physical endurance for our medical volunteers, and that every soul receiving care will tangibly encounter the healing touch and love of Jesus Christ!",
                            ScriptureRef = "Matthew 25:40",
                            MediaUrl = "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80",
                            PrayingCount = 48,
                            EncouragesCount = 56,
                            StrengthenedCount = 22,
                            CelebratesCount = 14,
                            CommentsCount = 6,
                            CreatedAt = DateTime.UtcNow.AddHours(-3)
                        },
                        new PublicCommunityPost
                        {
                            AuthorName = "Brother Mark Anthony",
                            AuthorRole = "Life Group Facilitator",
                            AvatarBg = "#0284c7",
                            PostType = "TESTIMONY",
                            MinistryGroup = "Discipleship & Life Groups",
                            Title = "Praise Report: Total Healing and Biopsy Clear!",
                            Content = "Hallelujah! Last month we submitted an urgent prayer request for my mother when doctors discovered a suspicious tumor. Today her official pathology results came back 100% benign and clear! The specialist called it extraordinary. Huge thanks to our EPIC family and prayer warriors who stood on faith with us. Never stop believing in God's promises!",
                            ScriptureRef = "Psalm 103:2-3",
                            CelebratesCount = 94,
                            EncouragesCount = 71,
                            PrayingCount = 18,
                            StrengthenedCount = 52,
                            CommentsCount = 11,
                            CreatedAt = DateTime.UtcNow.AddHours(-6)
                        },
                        new PublicCommunityPost
                        {
                            AuthorName = "Pastor Ronnel",
                            AuthorRole = "Senior Pastor",
                            AvatarBg = "#7c3aed",
                            PostType = "DEVOTIONAL",
                            MinistryGroup = "Pastoral Care",
                            Title = "Daily Strength: Turn Your Worry Into Worship",
                            Content = "Beloved family: Whenever anxiety knocks at the door of your heart today, remember that God has already walked your tomorrow. Philippians 4:6 urges us: 'In every situation, by prayer and petition, with thanksgiving, present your requests to God.' You do not have to carry the weight alone. Lay it down at the altar, take a deep breath, and watch God turn your worry into worship!",
                            ScriptureRef = "Philippians 4:6-7",
                            EncouragesCount = 126,
                            StrengthenedCount = 94,
                            CelebratesCount = 42,
                            PrayingCount = 25,
                            CommentsCount = 9,
                            CreatedAt = DateTime.UtcNow.AddHours(-11)
                        },
                        new PublicCommunityPost
                        {
                            AuthorName = "Pastor Jed & Youth Crew",
                            AuthorRole = "Youth Director",
                            AvatarBg = "#db2777",
                            PostType = "CELEBRATION",
                            MinistryGroup = "Youth Ministry",
                            Title = "EPIC Youth Encounter: 18 New Decisions for Christ!",
                            Content = "Glory to God! Over 120 high school & college students filled the courtyard last night for an unforgettable evening of worship around the bonfire. 18 young men and women surrendered their lives to Jesus and took their first step into baptism and discipleship! Keep our youth in prayer as they shine brightly on their school campuses.",
                            ScriptureRef = "1 Timothy 4:12",
                            MediaUrl = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
                            CelebratesCount = 153,
                            EncouragesCount = 110,
                            StrengthenedCount = 76,
                            PrayingCount = 31,
                            CommentsCount = 14,
                            CreatedAt = DateTime.UtcNow.AddHours(-18)
                        },
                        new PublicCommunityPost
                        {
                            AuthorName = "Hannah Joy",
                            AuthorRole = "Worship Vocalist",
                            AvatarBg = "#ea580c",
                            PostType = "CHURCH_MOMENT",
                            MinistryGroup = "Worship & Arts",
                            Title = "Sunday Morning Pure Worship & Holy Reverence",
                            Content = "There is nothing on earth like corporate worship with the church family. Standing on the platform watching hands raised in tears and gratitude reminds me why we do what we do. Grateful to serve such a humble, Jesus-seeking congregation. May your entire week be filled with songs of victory!",
                            ScriptureRef = "Psalm 100:1-5",
                            MediaUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
                            EncouragesCount = 84,
                            CelebratesCount = 68,
                            StrengthenedCount = 59,
                            PrayingCount = 16,
                            CommentsCount = 5,
                            CreatedAt = DateTime.UtcNow.AddHours(-26)
                        },
                        new PublicCommunityPost
                        {
                            AuthorName = "David & Leah Santos",
                            AuthorRole = "Young Couples Ministry",
                            AvatarBg = "#0891b2",
                            PostType = "PRAYER",
                            MinistryGroup = "Family & Couples",
                            Title = "Prayer for Safe Delivery of our Firstborn Baby",
                            Content = "Church family, our due date is in 3 days! Please stand with Leah and me in prayer for smooth labor, safety for mommy and our baby girl, and wisdom for our attending doctors. We consecrate this child to the Lord from the very first breath.",
                            ScriptureRef = "1 Samuel 1:27",
                            PrayingCount = 67,
                            EncouragesCount = 52,
                            StrengthenedCount = 38,
                            CelebratesCount = 29,
                            CommentsCount = 8,
                            CreatedAt = DateTime.UtcNow.AddHours(-34)
                        }
                    };

                    _context.PublicCommunityPosts.AddRange(seeds);
                    _context.SaveChanges();

                    // Seed a few initial comments
                    var firstPost = _context.PublicCommunityPosts.FirstOrDefault();
                    if (firstPost != null)
                    {
                        _context.PublicCommunityComments.AddRange(
                            new PublicCommunityComment
                            {
                                PostId = firstPost.Id,
                                AuthorName = "Brother Alex",
                                AvatarBg = "#0284c7",
                                Content = "Count on our family's prayers! We will also prepare 50 hygiene packs to contribute to the mission.",
                                CreatedAt = DateTime.UtcNow.AddHours(-2)
                            },
                            new PublicCommunityComment
                            {
                                PostId = firstPost.Id,
                                AuthorName = "Sister Cynthia",
                                AvatarBg = "#db2777",
                                Content = "Praying for God's protection and an abundant harvest of souls. God bless the outreach team!",
                                CreatedAt = DateTime.UtcNow.AddHours(-1)
                            }
                        );
                        _context.SaveChanges();
                    }
                }
            }
            catch
            {
                // Fallback
            }
        }

        [HttpGet("feed")]
        public async Task<IActionResult> GetFeed(
            [FromQuery] string? type = null,
            [FromQuery] string? group = null,
            [FromQuery] string? search = null)
        {
            var query = _context.PublicCommunityPosts.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(type) && type.ToUpper() != "ALL")
            {
                query = query.Where(p => p.PostType.ToUpper() == type.ToUpper());
            }

            if (!string.IsNullOrWhiteSpace(group) && group.ToUpper() != "ALL")
            {
                query = query.Where(p => p.MinistryGroup.ToUpper().Contains(group.ToUpper()));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(p =>
                    p.Content.ToLower().Contains(q) ||
                    (p.Title != null && p.Title.ToLower().Contains(q)) ||
                    p.AuthorName.ToLower().Contains(q) ||
                    (p.ScriptureRef != null && p.ScriptureRef.ToLower().Contains(q))
                );
            }

            var posts = await query.OrderByDescending(p => p.CreatedAt).Take(50).ToListAsync();

            // Fetch comments for these posts
            var postIds = posts.Select(p => p.Id).ToList();
            var comments = await _context.PublicCommunityComments.AsNoTracking()
                .Where(c => postIds.Contains(c.PostId))
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            var commentsGrouped = comments.GroupBy(c => c.PostId).ToDictionary(g => g.Key, g => g.ToList());

            var result = posts.Select(p => new
            {
                p.Id,
                p.AuthorName,
                p.AuthorRole,
                p.AvatarBg,
                p.PostType,
                p.MinistryGroup,
                p.Title,
                p.Content,
                p.ScriptureRef,
                p.MediaUrl,
                p.EncouragesCount,
                p.PrayingCount,
                p.StrengthenedCount,
                p.CelebratesCount,
                CommentsCount = commentsGrouped.ContainsKey(p.Id) ? commentsGrouped[p.Id].Count : p.CommentsCount,
                p.CreatedAt,
                Comments = commentsGrouped.ContainsKey(p.Id) ? commentsGrouped[p.Id] : new List<PublicCommunityComment>()
            });

            return Ok(result);
        }

        public record CreatePostDto(
            string AuthorName,
            string? AuthorRole,
            string PostType,
            string? MinistryGroup,
            string? Title,
            string Content,
            string? ScriptureRef,
            string? MediaUrl
        );

        [HttpPost("post")]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content))
                return BadRequest("Post content is required.");

            // Moderate toxic words
            var toxicWords = new[] { "hate", "scam", "betray", "idiot", "damn", "curse" };
            if (toxicWords.Any(w => dto.Content.ToLower().Contains(w)))
            {
                return BadRequest("Let all our words be seasoned with grace and encouragement (Ephesians 4:29). Please rephrase your post.");
            }

            var post = new PublicCommunityPost
            {
                AuthorName = string.IsNullOrWhiteSpace(dto.AuthorName) ? "Church Member" : dto.AuthorName.Trim(),
                AuthorRole = string.IsNullOrWhiteSpace(dto.AuthorRole) ? "Believer" : dto.AuthorRole.Trim(),
                AvatarBg = PickColor(dto.AuthorName),
                PostType = string.IsNullOrWhiteSpace(dto.PostType) ? "ENCOURAGEMENT" : dto.PostType.ToUpper(),
                MinistryGroup = string.IsNullOrWhiteSpace(dto.MinistryGroup) ? "General" : dto.MinistryGroup.Trim(),
                Title = dto.Title?.Trim(),
                Content = dto.Content.Trim(),
                ScriptureRef = dto.ScriptureRef?.Trim(),
                MediaUrl = dto.MediaUrl?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.PublicCommunityPosts.Add(post);
            await _context.SaveChangesAsync();

            return Ok(post);
        }

        public record ReactDto(int PostId, string UserToken, string ReactionType);

        [HttpPost("react")]
        public async Task<IActionResult> React([FromBody] ReactDto dto)
        {
            var post = await _context.PublicCommunityPosts.FindAsync(dto.PostId);
            if (post == null) return NotFound("Post not found.");

            var reactionType = dto.ReactionType.ToUpper();
            var existing = await _context.PublicCommunityReactions.FirstOrDefaultAsync(r =>
                r.PostId == dto.PostId && r.UserToken == dto.UserToken);

            if (existing != null)
            {
                if (existing.ReactionType == reactionType)
                {
                    // Toggle off
                    _context.PublicCommunityReactions.Remove(existing);
                    DecrementReaction(post, reactionType);
                }
                else
                {
                    // Switch reaction
                    DecrementReaction(post, existing.ReactionType);
                    existing.ReactionType = reactionType;
                    IncrementReaction(post, reactionType);
                }
            }
            else
            {
                // Add new reaction
                _context.PublicCommunityReactions.Add(new PublicCommunityReaction
                {
                    PostId = dto.PostId,
                    UserToken = dto.UserToken,
                    ReactionType = reactionType,
                    CreatedAt = DateTime.UtcNow
                });
                IncrementReaction(post, reactionType);
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                post.Id,
                post.EncouragesCount,
                post.PrayingCount,
                post.StrengthenedCount,
                post.CelebratesCount
            });
        }

        public record PrayDto(int PostId, string UserToken);

        [HttpPost("pray")]
        public async Task<IActionResult> Pray([FromBody] PrayDto dto)
        {
            var post = await _context.PublicCommunityPosts.FindAsync(dto.PostId);
            if (post == null) return NotFound("Post not found.");

            var existing = await _context.PublicCommunityPrayers.FirstOrDefaultAsync(p =>
                p.PostId == dto.PostId && p.UserToken == dto.UserToken);

            if (existing == null)
            {
                _context.PublicCommunityPrayers.Add(new PublicCommunityPrayer
                {
                    PostId = dto.PostId,
                    UserToken = dto.UserToken,
                    PrayedAt = DateTime.UtcNow
                });
                post.PrayingCount += 1;
                await _context.SaveChangesAsync();
            }

            return Ok(new { post.Id, post.PrayingCount });
        }

        public record CommentDto(int PostId, string AuthorName, string Content);

        [HttpPost("comment")]
        public async Task<IActionResult> AddComment([FromBody] CommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content))
                return BadRequest("Comment cannot be empty.");

            var post = await _context.PublicCommunityPosts.FindAsync(dto.PostId);
            if (post == null) return NotFound("Post not found.");

            var comment = new PublicCommunityComment
            {
                PostId = dto.PostId,
                AuthorName = string.IsNullOrWhiteSpace(dto.AuthorName) ? "Fellow Believer" : dto.AuthorName.Trim(),
                AvatarBg = PickColor(dto.AuthorName),
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.PublicCommunityComments.Add(comment);
            post.CommentsCount += 1;
            await _context.SaveChangesAsync();

            return Ok(comment);
        }

        [HttpGet("stories")]
        public IActionResult GetStories()
        {
            var stories = new[]
            {
                new
                {
                    Id = "story-1",
                    Title = "Sunday Praise",
                    Ministry = "Worship & Arts",
                    AvatarUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
                    ImageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
                    Caption = "Over 450 worshippers in pure adoration this Sunday morning. Jesus is moving in EPIC!",
                    TimeAgo = "2h ago",
                    HasUnseen = true
                },
                new
                {
                    Id = "story-2",
                    Title = "Youth Encounter",
                    Ministry = "Youth Ministry",
                    AvatarUrl = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80",
                    ImageUrl = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
                    Caption = "Unstoppable generation gathered around the bonfire for surrender and revival!",
                    TimeAgo = "5h ago",
                    HasUnseen = true
                },
                new
                {
                    Id = "story-3",
                    Title = "Pastor's Bread",
                    Ministry = "Pastoral Care",
                    AvatarUrl = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
                    ImageUrl = "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80",
                    Caption = "'The Lord is your keeper; the Lord is your shade on your right hand.' Psalm 121:5. Rest in His peace today.",
                    TimeAgo = "7h ago",
                    HasUnseen = true
                },
                new
                {
                    Id = "story-4",
                    Title = "Compassion Aid",
                    Ministry = "Outreach Team",
                    AvatarUrl = "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=400&q=80",
                    ImageUrl = "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80",
                    Caption = "Free pediatric medicines and grocery baskets ready for distribution tomorrow!",
                    TimeAgo = "10h ago",
                    HasUnseen = false
                },
                new
                {
                    Id = "story-5",
                    Title = "Water Baptism",
                    Ministry = "Discipleship",
                    AvatarUrl = "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=400&q=80",
                    ImageUrl = "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80",
                    Caption = "Tears of joy as 28 believers took the sacred step of water baptism.",
                    TimeAgo = "14h ago",
                    HasUnseen = false
                },
                new
                {
                    Id = "story-6",
                    Title = "Media Booth",
                    Ministry = "Tech Operations",
                    AvatarUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80",
                    ImageUrl = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
                    Caption = "Live streaming feeds broadcasting gospel hope to overseas families worldwide!",
                    TimeAgo = "18h ago",
                    HasUnseen = false
                }
            };

            return Ok(stories);
        }

        [HttpGet("shorts")]
        public IActionResult GetShorts()
        {
            var shorts = new[]
            {
                new
                {
                    Id = "short-1",
                    Title = "God Is Fighting For You",
                    Speaker = "Pastor Ronnel",
                    Ministry = "Pastoral Encouragement",
                    Scripture = "Exodus 14:14",
                    ScriptureText = "The Lord will fight for you; you need only to be still.",
                    VideoPlaceholderBg = "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)",
                    VideoUrl = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
                    Duration = "0:35",
                    Likes = 284,
                    Prayers = 112
                },
                new
                {
                    Id = "short-2",
                    Title = "Unstoppable Worship Acoustic",
                    Speaker = "EPIC Youth Band",
                    Ministry = "Youth Encounters",
                    Scripture = "Psalm 103:1",
                    ScriptureText = "Praise the Lord, my soul; all my inmost being, praise his holy name.",
                    VideoPlaceholderBg = "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #db2777 100%)",
                    VideoUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
                    Duration = "0:42",
                    Likes = 341,
                    Prayers = 89
                },
                new
                {
                    Id = "short-3",
                    Title = "How to Defeat Anxiety Today",
                    Speaker = "Sister Grace Villanueva",
                    Ministry = "Discipleship Academy",
                    Scripture = "1 Peter 5:7",
                    ScriptureText = "Cast all your anxiety on him because he cares for you.",
                    VideoPlaceholderBg = "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
                    VideoUrl = "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80",
                    Duration = "0:30",
                    Likes = 219,
                    Prayers = 145
                },
                new
                {
                    Id = "short-4",
                    Title = "From Brokenness to Restoration",
                    Speaker = "Brother Mark Anthony",
                    Ministry = "Life Testimonies",
                    Scripture = "Jeremiah 29:11",
                    ScriptureText = "'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, plans to give you hope and a future.'",
                    VideoPlaceholderBg = "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #f97316 100%)",
                    VideoUrl = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
                    Duration = "0:48",
                    Likes = 405,
                    Prayers = 178
                }
            };

            return Ok(shorts);
        }

        private static void IncrementReaction(PublicCommunityPost post, string type)
        {
            switch (type)
            {
                case "ENCOURAGE": post.EncouragesCount += 1; break;
                case "PRAYING": post.PrayingCount += 1; break;
                case "STRENGTHENED": post.StrengthenedCount += 1; break;
                case "CELEBRATE": post.CelebratesCount += 1; break;
            }
        }

        private static void DecrementReaction(PublicCommunityPost post, string type)
        {
            switch (type)
            {
                case "ENCOURAGE": post.EncouragesCount = Math.Max(0, post.EncouragesCount - 1); break;
                case "PRAYING": post.PrayingCount = Math.Max(0, post.PrayingCount - 1); break;
                case "STRENGTHENED": post.StrengthenedCount = Math.Max(0, post.StrengthenedCount - 1); break;
                case "CELEBRATE": post.CelebratesCount = Math.Max(0, post.CelebratesCount - 1); break;
            }
        }

        private static string PickColor(string? name)
        {
            var colors = new[] { "#0284c7", "#059669", "#7c3aed", "#db2777", "#ea580c", "#0891b2", "#d97706" };
            if (string.IsNullOrWhiteSpace(name)) return colors[0];
            int hash = Math.Abs(name.GetHashCode());
            return colors[hash % colors.Length];
        }
    }
}
