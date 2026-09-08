using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Data;
public partial class ApplicationDbContext
{
    public DbSet<CommunityContent> CommunityContent => Set<CommunityContent>();
    public DbSet<CommunityReaction> CommunityReactions => Set<CommunityReaction>();
    public DbSet<CommunityBlock> CommunityBlocks => Set<CommunityBlock>();
    public DbSet<CommunityReport> CommunityReports => Set<CommunityReport>();
    public DbSet<CommunityReview> CommunityReviews => Set<CommunityReview>();
}
