using FlowBoard.Api.Auth;
using FlowBoard.Api.Contracts;
using FlowBoard.Api.Hubs;
using FlowBoard.Api.Services;
using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ListsController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;
    private readonly ActivityRecorder _activity;

    public ListsController(IAppDbContext db, IHubContext<BoardHub> hub, ActivityRecorder activity)
    {
        _db = db;
        _hub = hub;
        _activity = activity;
    }

    [HttpPost]
    public async Task<ActionResult<BoardList>> Create(CreateListRequest req, CancellationToken ct)
    {
        var board = await _db.Boards.Include(b => b.Lists).FirstOrDefaultAsync(b => b.Id == req.BoardId, ct);
        if (board is null) return NotFound("Pano bulunamadı.");
        if (!await BoardAccess.IsMemberAsync(_db, board.Id, User.GetUserId(), ct)) return Forbid();

        var nextPosition = board.Lists.Count == 0 ? 0 : board.Lists.Max(l => l.Position) + 1;
        var list = new BoardList
        {
            Id = Guid.NewGuid(),
            Title = req.Title,
            Position = nextPosition,
            BoardId = req.BoardId,
        };

        _db.Lists.Add(list);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(req.BoardId.ToString()).SendAsync("ListCreated", list, ct);
        await _activity.RecordAsync(User, req.BoardId, "list.created", new { title = list.Title }, ct);
        return Ok(list);
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<BoardList>> Update(Guid id, UpdateListRequest req, CancellationToken ct)
    {
        var list = await _db.Lists.FirstOrDefaultAsync(l => l.Id == id, ct);
        if (list is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, list.BoardId, User.GetUserId(), ct)) return Forbid();

        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Başlık zorunlu.");
        list.Title = req.Title.Trim();
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(list.BoardId.ToString()).SendAsync("ListUpdated", list, ct);
        return Ok(list);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var list = await _db.Lists.FirstOrDefaultAsync(l => l.Id == id, ct);
        if (list is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, list.BoardId, User.GetUserId(), ct)) return Forbid();

        var boardId = list.BoardId;
        var listTitle = list.Title;
        _db.Lists.Remove(list);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString()).SendAsync("ListDeleted", new { id, boardId }, ct);
        await _activity.RecordAsync(User, boardId, "list.deleted", new { title = listTitle }, ct);
        return NoContent();
    }
}
