using System.Security.Claims;
using System.Text.Json;
using FlowBoard.Api.Hubs;
using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Services;

public class ActivityRecorder
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;

    public ActivityRecorder(IAppDbContext db, IHubContext<BoardHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task RecordAsync(
        ClaimsPrincipal principal,
        Guid boardId,
        string action,
        object? payload,
        CancellationToken ct)
    {
        var actorId = Guid.TryParse(principal.FindFirst("sub")?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id)
            ? id
            : Guid.Empty;
        if (actorId == Guid.Empty) return;

        var user = await _db.Users.FindAsync(new object?[] { actorId }, ct);
        var actorName = user?.DisplayName ?? "Bilinmeyen";

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            ActorId = actorId,
            ActorName = actorName,
            Action = action,
            Payload = payload is null ? "{}" : JsonSerializer.Serialize(payload),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Activities.Add(activity);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString()).SendAsync("ActivityRecorded", activity, ct);
    }
}
