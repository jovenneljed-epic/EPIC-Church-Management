using System.Security.Claims;
using EPIC.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Services;

[Authorize]
public sealed class ChatHub(ApplicationDbContext db) : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (!int.TryParse(Context.UserIdentifier, out var id) || !await db.Users.AnyAsync(u => u.UserId == id && u.IsActive)) { Context.Abort(); return; }
        await base.OnConnectedAsync();
    }
    // Only invalidation signals are sent here. Every message read/send rechecks database membership over REST.
}
public sealed class ChatUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) => connection.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? connection.User?.FindFirstValue("userId");
}
public sealed class NotificationWakeSignal
{
    private readonly SemaphoreSlim signal = new(0, 1);
    public void Pulse() { try { signal.Release(); } catch (SemaphoreFullException) { } }
    public async Task Wait(CancellationToken ct) => await signal.WaitAsync(TimeSpan.FromSeconds(15), ct);
}
