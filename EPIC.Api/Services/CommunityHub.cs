using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace EPIC.Api.Services;

/// <summary>
/// Real-time SignalR Hub for the church community social feed.
/// Open to all connected clients (members, staff, visitors) so whenever someone posts,
/// reacts, prays, or comments, everybody sees the update in real time.
/// </summary>
public sealed class CommunityHub : Hub
{
    public const string HUB_PATH = "/hubs/community";

    public async Task JoinFeed()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "CommunityFeed");
    }

    public async Task LeaveFeed()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "CommunityFeed");
    }
}
