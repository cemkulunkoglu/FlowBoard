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
public class BoardsController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;
    private readonly ActivityRecorder _activity;

    public BoardsController(IAppDbContext db, IHubContext<BoardHub> hub, ActivityRecorder activity)
    {
        _db = db;
        _hub = hub;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Board>>> List(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var boards = await _db.BoardMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.Board)
            .OrderByDescending(b => b.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);
        return Ok(boards);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Board>> Get(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var isMember = await _db.BoardMembers.AnyAsync(m => m.BoardId == id && m.UserId == userId, ct);
        if (!isMember)
        {
            var exists = await _db.Boards.AnyAsync(b => b.Id == id, ct);
            return exists ? Forbid() : NotFound();
        }

        var board = await _db.Boards
            .Include(b => b.Labels)
            .Include(b => b.Members).ThenInclude(m => m.User)
            .Include(b => b.Lists).ThenInclude(l => l.Cards).ThenInclude(c => c.Labels)
            .Include(b => b.Lists).ThenInclude(l => l.Cards).ThenInclude(c => c.Assignees)
            .Include(b => b.Lists).ThenInclude(l => l.Cards).ThenInclude(c => c.ChecklistItems)
            .AsNoTracking()
            .FirstAsync(b => b.Id == id, ct);
        return Ok(board);
    }

    [HttpPost]
    public async Task<ActionResult<Board>> Create(CreateBoardRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Başlık zorunlu.");

        var userId = User.GetUserId();
        var board = new Board
        {
            Id = Guid.NewGuid(),
            Title = req.Title.Trim(),
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Boards.Add(board);
        _db.BoardMembers.Add(new BoardMember
        {
            BoardId = board.Id,
            UserId = userId,
            Role = BoardRole.Owner,
            JoinedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
        await _activity.RecordAsync(User, board.Id, "board.created", new { title = board.Title }, ct);
        return Ok(board);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Board>> Update(Guid id, UpdateBoardRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (board is null) return NotFound();
        if (board.OwnerId != userId) return Forbid();

        var oldTitle = board.Title;
        board.Title = req.Title.Trim();
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(board.Id.ToString()).SendAsync("BoardUpdated",
            new { id = board.Id, title = board.Title }, ct);
        await _activity.RecordAsync(User, board.Id, "board.renamed",
            new { from = oldTitle, to = board.Title }, ct);
        return Ok(board);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (board is null) return NotFound();
        if (board.OwnerId != userId) return Forbid();

        _db.Boards.Remove(board);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
