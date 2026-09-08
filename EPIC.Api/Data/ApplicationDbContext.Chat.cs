using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Data;
public partial class ApplicationDbContext
{
    public DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
    public DbSet<ChatMembership> ChatMemberships => Set<ChatMembership>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
}
