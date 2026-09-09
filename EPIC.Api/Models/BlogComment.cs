using System;

namespace EPIC.Api.Models
{
    public class BlogComment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        public string ArticleId { get; set; } = "";

        public string? ParentCommentId { get; set; }

        public string AuthorName { get; set; } = "Faithful Believer";

        public string AuthorRole { get; set; } = "Church Member";

        public string AvatarBg { get; set; } = "#0284c7";

        public string Content { get; set; } = "";

        public int Likes { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
