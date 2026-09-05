namespace EPIC.Api.Models;

public class Announcement
{
    public int Id { get; set; }

    public string Title { get; set; } = "";

    public string Content { get; set; } = "";

    public string Category { get; set; } = "Update";

    public string? ImageUrl { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTime PublishDate { get; set; } = DateTime.UtcNow;

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}