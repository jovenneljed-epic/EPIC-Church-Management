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
    [Route("api/blog")]
    public class BlogEngagementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static bool _tablesEnsured = false;
        private static readonly object _tableLock = new object();

        public BlogEngagementController(ApplicationDbContext context)
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
                        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BlogComments')
                        BEGIN
                            CREATE TABLE BlogComments (
                                Id NVARCHAR(50) PRIMARY KEY,
                                ArticleId NVARCHAR(100) NOT NULL,
                                ParentCommentId NVARCHAR(50) NULL,
                                AuthorName NVARCHAR(150) NOT NULL,
                                AuthorRole NVARCHAR(100) NOT NULL DEFAULT 'Church Member',
                                AvatarBg NVARCHAR(30) NOT NULL DEFAULT '#0284c7',
                                Content NVARCHAR(MAX) NOT NULL,
                                Likes INT NOT NULL DEFAULT 0,
                                CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                            );
                            CREATE INDEX IX_BlogComments_ArticleId ON BlogComments(ArticleId);
                        END;

                        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BlogReactions')
                        BEGIN
                            CREATE TABLE BlogReactions (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                ArticleId NVARCHAR(100) NOT NULL,
                                Likes INT NOT NULL DEFAULT 0,
                                Hearts INT NOT NULL DEFAULT 0,
                                Amens INT NOT NULL DEFAULT 0,
                                Insights INT NOT NULL DEFAULT 0,
                                Blesseds INT NOT NULL DEFAULT 0,
                                Shares INT NOT NULL DEFAULT 0,
                                LastUpdated DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                            );
                            CREATE UNIQUE INDEX IX_BlogReactions_ArticleId ON BlogReactions(ArticleId);
                        END;
                    ";
                    _context.Database.ExecuteSqlRaw(sql);
                    _tablesEnsured = true;
                }
                catch
                {
                    // Table verification fallback
                }
            }
        }

        // ==========================================
        // GET ENGAGEMENT FOR ARTICLE
        // GET /api/blog/{articleId}/engagement
        // ==========================================
        [HttpGet("{articleId}/engagement")]
        public async Task<IActionResult> GetArticleEngagement(string articleId)
        {
            var reactions = await _context.BlogReactions
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.ArticleId == articleId);

            var rawComments = await _context.BlogComments
                .AsNoTracking()
                .Where(c => c.ArticleId == articleId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            var topLevelComments = rawComments
                .Where(c => string.IsNullOrEmpty(c.ParentCommentId))
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.ArticleId,
                    c.AuthorName,
                    c.AuthorRole,
                    c.AvatarBg,
                    timestamp = FormatTimeAgo(c.CreatedAt),
                    c.Content,
                    c.Likes,
                    replies = rawComments
                        .Where(r => r.ParentCommentId == c.Id)
                        .OrderBy(r => r.CreatedAt)
                        .Select(r => new
                        {
                            r.Id,
                            r.AuthorName,
                            r.AuthorRole,
                            r.AvatarBg,
                            timestamp = FormatTimeAgo(r.CreatedAt),
                            r.Content
                        })
                        .ToList()
                })
                .ToList();

            var seed = GetSeedReactions(articleId);
            var mergedReactions = new
            {
                likes = (reactions?.Likes ?? 0) + seed.Likes,
                hearts = (reactions?.Hearts ?? 0) + seed.Hearts,
                amens = (reactions?.Amens ?? 0) + seed.Amens,
                insights = (reactions?.Insights ?? 0) + seed.Insights,
                blesseds = (reactions?.Blesseds ?? 0) + seed.Blesseds,
                shares = (reactions?.Shares ?? 0) + seed.Shares
            };

            return Ok(new
            {
                articleId,
                reactions = mergedReactions,
                comments = topLevelComments
            });
        }

        // ==========================================
        // GET ENGAGEMENT SUMMARY FOR ALL ARTICLES
        // GET /api/blog/engagement/summary
        // ==========================================
        [HttpGet("engagement/summary")]
        public async Task<IActionResult> GetEngagementSummary()
        {
            var reactions = await _context.BlogReactions.AsNoTracking().ToListAsync();
            var commentCounts = await _context.BlogComments
                .AsNoTracking()
                .GroupBy(c => c.ArticleId)
                .Select(g => new { ArticleId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.ArticleId, g => g.Count);

            var result = new Dictionary<string, object>();
            foreach (var r in reactions)
            {
                var seed = GetSeedReactions(r.ArticleId);
                result[r.ArticleId] = new
                {
                    reactions = new
                    {
                        likes = r.Likes + seed.Likes,
                        hearts = r.Hearts + seed.Hearts,
                        amens = r.Amens + seed.Amens,
                        insights = r.Insights + seed.Insights,
                        blesseds = r.Blesseds + seed.Blesseds,
                        shares = r.Shares + seed.Shares
                    },
                    commentsCount = commentCounts.GetValueOrDefault(r.ArticleId, 0)
                };
            }

            return Ok(result);
        }

        // ==========================================
        // REACT TO ARTICLE
        // POST /api/blog/{articleId}/react
        // ==========================================
        [HttpPost("{articleId}/react")]
        public async Task<IActionResult> ReactToArticle(string articleId, [FromBody] ReactRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ReactionType))
            {
                return BadRequest("Invalid reaction payload.");
            }

            var row = await _context.BlogReactions.FirstOrDefaultAsync(r => r.ArticleId == articleId);
            if (row == null)
            {
                row = new BlogReaction { ArticleId = articleId };
                _context.BlogReactions.Add(row);
            }

            // Decrement previous reaction if switching
            if (!string.IsNullOrEmpty(request.PreviousReaction))
            {
                switch (request.PreviousReaction.ToLowerInvariant())
                {
                    case "like": row.Likes = Math.Max(0, row.Likes - 1); break;
                    case "heart": row.Hearts = Math.Max(0, row.Hearts - 1); break;
                    case "amen": row.Amens = Math.Max(0, row.Amens - 1); break;
                    case "insight": row.Insights = Math.Max(0, row.Insights - 1); break;
                    case "blessed": row.Blesseds = Math.Max(0, row.Blesseds - 1); break;
                }
            }

            // Increment new reaction
            switch (request.ReactionType.ToLowerInvariant())
            {
                case "like": row.Likes++; break;
                case "heart": row.Hearts++; break;
                case "amen": row.Amens++; break;
                case "insight": row.Insights++; break;
                case "blessed": row.Blesseds++; break;
                case "remove": break;
            }

            row.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var seed = GetSeedReactions(articleId);
            return Ok(new
            {
                likes = row.Likes + seed.Likes,
                hearts = row.Hearts + seed.Hearts,
                amens = row.Amens + seed.Amens,
                insights = row.Insights + seed.Insights,
                blesseds = row.Blesseds + seed.Blesseds,
                shares = row.Shares + seed.Shares
            });
        }

        // ==========================================
        // SHARE ARTICLE
        // POST /api/blog/{articleId}/share
        // ==========================================
        [HttpPost("{articleId}/share")]
        public async Task<IActionResult> ShareArticle(string articleId)
        {
            var row = await _context.BlogReactions.FirstOrDefaultAsync(r => r.ArticleId == articleId);
            if (row == null)
            {
                row = new BlogReaction { ArticleId = articleId };
                _context.BlogReactions.Add(row);
            }

            row.Shares++;
            row.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var seed = GetSeedReactions(articleId);
            return Ok(new
            {
                likes = row.Likes + seed.Likes,
                hearts = row.Hearts + seed.Hearts,
                amens = row.Amens + seed.Amens,
                insights = row.Insights + seed.Insights,
                blesseds = row.Blesseds + seed.Blesseds,
                shares = row.Shares + seed.Shares
            });
        }

        // ==========================================
        // POST COMMENT DIRECTLY TO ARTICLE
        // POST /api/blog/{articleId}/comment
        // ==========================================
        [HttpPost("{articleId}/comment")]
        public async Task<IActionResult> PostComment(string articleId, [FromBody] NewCommentRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest("Comment content cannot be empty.");
            }

            string[] avatarColors = { "#0284c7", "#0d9488", "#7c3aed", "#e11d48", "#d97706", "#2563eb", "#059669" };
            var color = string.IsNullOrWhiteSpace(request.AvatarBg)
                ? avatarColors[Math.Abs(request.AuthorName?.GetHashCode() ?? 0) % avatarColors.Length]
                : request.AvatarBg;

            var comment = new BlogComment
            {
                Id = Guid.NewGuid().ToString("N"),
                ArticleId = articleId,
                AuthorName = string.IsNullOrWhiteSpace(request.AuthorName) ? "Faithful Believer" : request.AuthorName.Trim(),
                AuthorRole = string.IsNullOrWhiteSpace(request.AuthorRole) ? "Church Member" : request.AuthorRole.Trim(),
                AvatarBg = color,
                Content = request.Content.Trim(),
                Likes = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.BlogComments.Add(comment);
            await _context.SaveChangesAsync();

            // Return created comment with formatted fields
            return Ok(new
            {
                comment.Id,
                comment.ArticleId,
                comment.AuthorName,
                comment.AuthorRole,
                comment.AvatarBg,
                timestamp = "Just now",
                comment.Content,
                comment.Likes,
                replies = new List<object>()
            });
        }

        // ==========================================
        // POST REPLY TO COMMENT
        // POST /api/blog/{articleId}/comment/{commentId}/reply
        // ==========================================
        [HttpPost("{articleId}/comment/{commentId}/reply")]
        public async Task<IActionResult> PostReply(string articleId, string commentId, [FromBody] NewReplyRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest("Reply content cannot be empty.");
            }

            string[] avatarColors = { "#0284c7", "#0d9488", "#7c3aed", "#e11d48", "#d97706", "#2563eb", "#059669" };
            var color = avatarColors[Math.Abs(request.AuthorName?.GetHashCode() ?? 0) % avatarColors.Length];

            var reply = new BlogComment
            {
                Id = Guid.NewGuid().ToString("N"),
                ArticleId = articleId,
                ParentCommentId = commentId,
                AuthorName = string.IsNullOrWhiteSpace(request.AuthorName) ? "Fellow Disciple" : request.AuthorName.Trim(),
                AuthorRole = "Church Member",
                AvatarBg = color,
                Content = request.Content.Trim(),
                Likes = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.BlogComments.Add(reply);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                reply.Id,
                reply.AuthorName,
                reply.AuthorRole,
                reply.AvatarBg,
                timestamp = "Just now",
                reply.Content
            });
        }

        // ==========================================
        // LIKE COMMENT
        // POST /api/blog/{articleId}/comment/{commentId}/like
        // ==========================================
        [HttpPost("{articleId}/comment/{commentId}/like")]
        public async Task<IActionResult> LikeComment(string articleId, string commentId, [FromBody] LikeCommentRequest request)
        {
            var comment = await _context.BlogComments.FirstOrDefaultAsync(c => c.Id == commentId && c.ArticleId == articleId);
            if (comment == null)
            {
                return NotFound("Comment not found.");
            }

            if (request != null && !request.Increment)
            {
                comment.Likes = Math.Max(0, comment.Likes - 1);
            }
            else
            {
                comment.Likes++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { commentId, likes = comment.Likes });
        }

        private static (int Likes, int Hearts, int Amens, int Insights, int Blesseds, int Shares) GetSeedReactions(string articleId)
        {
            int hash = 0;
            for (int i = 0; i < articleId.Length; i++)
            {
                hash = (hash << 5) - hash + articleId[i];
            }
            int seed = Math.Abs(hash);
            return (
                45 + (seed % 95),
                30 + ((seed >> 2) % 65),
                20 + ((seed >> 4) % 45),
                12 + ((seed >> 6) % 30),
                8 + ((seed >> 8) % 25),
                15 + ((seed >> 10) % 35)
            );
        }

        private static string FormatTimeAgo(DateTime dt)
        {
            var diff = DateTime.UtcNow - dt;
            if (diff.TotalSeconds < 60) return "Just now";
            if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes}m ago";
            if (diff.TotalHours < 24) return $"{(int)diff.TotalHours}h ago";
            if (diff.TotalDays < 7) return $"{(int)diff.TotalDays}d ago";
            return dt.ToString("MMM d, yyyy");
        }
    }

    public class ReactRequest
    {
        public string ReactionType { get; set; } = "";
        public string? PreviousReaction { get; set; }
    }

    public class NewCommentRequest
    {
        public string AuthorName { get; set; } = "";
        public string AuthorRole { get; set; } = "Church Member";
        public string Content { get; set; } = "";
        public string? AvatarBg { get; set; }
    }

    public class NewReplyRequest
    {
        public string AuthorName { get; set; } = "";
        public string Content { get; set; } = "";
    }

    public class LikeCommentRequest
    {
        public bool Increment { get; set; } = true;
    }
}
