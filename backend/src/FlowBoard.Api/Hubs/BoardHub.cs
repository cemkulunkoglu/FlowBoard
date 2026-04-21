using System.Collections.Concurrent;
using FlowBoard.Api.Auth;
using FlowBoard.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Hubs;

[Authorize]
public class BoardHub : Hub
{
    private static readonly ConcurrentDictionary<string, Presence> _connections = new();

    private readonly IAppDbContext _db;

    public BoardHub(IAppDbContext db) => _db = db;

    private record Presence(Guid UserId, Guid BoardId, string DisplayName);

    public async Task JoinBoard(Guid boardId)
    {
        if (Context.User is null) throw new HubException("Unauthorized");
        var userId = Context.User.GetUserId();

        var isMember = await _db.BoardMembers.AnyAsync(m => m.BoardId == boardId && m.UserId == userId);
        if (!isMember) throw new HubException("Forbidden");

        var user = await _db.Users.FindAsync(userId);
        if (user is null) throw new HubException("User not found");

        await Groups.AddToGroupAsync(Context.ConnectionId, boardId.ToString());
        _connections[Context.ConnectionId] = new Presence(userId, boardId, user.DisplayName);

        var snapshot = _connections.Values
            .Where(p => p.BoardId == boardId)
            .GroupBy(p => p.UserId)
            .Select(g => new { userId = g.Key, displayName = g.First().DisplayName })
            .ToArray();

        await Clients.Caller.SendAsync("PresenceSnapshot", snapshot);
        await Clients.OthersInGroup(boardId.ToString()).SendAsync("UserJoined",
            new { userId, displayName = user.DisplayName });
    }

    public async Task LeaveBoard(Guid boardId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, boardId.ToString());
        if (_connections.TryRemove(Context.ConnectionId, out var presence))
        {
            var hasOther = _connections.Values.Any(c => c.UserId == presence.UserId && c.BoardId == presence.BoardId);
            if (!hasOther)
            {
                await Clients.Group(presence.BoardId.ToString())
                    .SendAsync("UserLeft", new { userId = presence.UserId });
            }
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryRemove(Context.ConnectionId, out var presence))
        {
            var hasOther = _connections.Values.Any(c => c.UserId == presence.UserId && c.BoardId == presence.BoardId);
            if (!hasOther)
            {
                await Clients.Group(presence.BoardId.ToString())
                    .SendAsync("UserLeft", new { userId = presence.UserId });
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
