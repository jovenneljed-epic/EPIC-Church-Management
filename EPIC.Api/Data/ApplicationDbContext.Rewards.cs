using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Data;
public partial class ApplicationDbContext
{
    public DbSet<MemberReward> MemberRewards => Set<MemberReward>();
    public DbSet<MemberRewardHistory> MemberRewardHistory => Set<MemberRewardHistory>();
}
