using System;
using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class PublicCommunityPost
    {
        public int Id { get; set; }
        [MaxLength(150)] public string AuthorName { get; set; } = "Church Member";
        [MaxLength(100)] public string AuthorRole { get; set; } = "Believer";
        [MaxLength(50)] public string AvatarBg { get; set; } = "#0284c7";
        [MaxLength(50)] public string PostType { get; set; } = "ENCOURAGEMENT"; // PRAYER, TESTIMONY, VERSE, DEVOTIONAL, CELEBRATION, CHURCH_MOMENT
        [MaxLength(100)] public string MinistryGroup { get; set; } = "General"; // Youth, Worship, Men's, Women's, Life Groups
        [MaxLength(250)] public string? Title { get; set; }
        public string Content { get; set; } = "";
        [MaxLength(150)] public string? ScriptureRef { get; set; }
        public string? MediaUrl { get; set; }
        public int EncouragesCount { get; set; } = 0;
        public int PrayingCount { get; set; } = 0;
        public int StrengthenedCount { get; set; } = 0;
        public int CelebratesCount { get; set; } = 0;
        public int CommentsCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PublicCommunityComment
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        [MaxLength(150)] public string AuthorName { get; set; } = "Brother in Christ";
        [MaxLength(50)] public string AvatarBg { get; set; } = "#0284c7";
        public string Content { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PublicCommunityReaction
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        [MaxLength(100)] public string UserToken { get; set; } = "";
        [MaxLength(50)] public string ReactionType { get; set; } = "ENCOURAGE"; // ENCOURAGE, PRAYING, STRENGTHENED, CELEBRATE
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PublicCommunityPrayer
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        [MaxLength(100)] public string UserToken { get; set; } = "";
        public DateTime PrayedAt { get; set; } = DateTime.UtcNow;
    }
}
