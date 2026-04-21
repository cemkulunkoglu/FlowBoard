using FlowBoard.Api.Auth;
using FlowBoard.Api.Contracts;
using FlowBoard.Api.Hubs;
using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Controllers;

[ApiController]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;

    public CommentsController(IAppDbContext db, IHubContext<BoardHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpGet("/api/cards/{cardId:guid}/comments")]
    public async Task<ActionResult<IReadOnlyList<Comment>>> List(Guid cardId, CancellationToken ct)
    {
        var card = await _db.Cards.Include(c => c.List).FirstOrDefaultAsync(c => c.Id == cardId, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var comments = await _db.Comments
            .Where(c => c.CardId == cardId)
            .OrderBy(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);
        return Ok(comments);
    }

    [HttpPost("/api/cards/{cardId:guid}/comments")]
    public async Task<ActionResult<Comment>> Create(
        Guid cardId,
        CreateCommentRequest req,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Text)) return BadRequest("Metin zorunlu.");

        var card = await _db.Cards.Include(c => c.List).FirstOrDefaultAsync(c => c.Id == cardId, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var userId = User.GetUserId();
        var user = await _db.Users.FindAsync(new object?[] { userId }, ct);

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            CardId = cardId,
            AuthorId = userId,
            AuthorName = user?.DisplayName ?? "Bilinmeyen",
            Text = req.Text.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(card.List.BoardId.ToString())
            .SendAsync("CommentAdded", comment, ct);
        return Ok(comment);
    }

    [HttpDelete("/api/comments/{commentId:guid}")]
    public async Task<IActionResult> Delete(Guid commentId, CancellationToken ct)
    {
        var comment = await _db.Comments
            .Include(c => c.Card).ThenInclude(c => c.List)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct);
        if (comment is null) return NotFound();

        var userId = User.GetUserId();
        if (!await BoardAccess.IsMemberAsync(_db, comment.Card.List.BoardId, userId, ct)) return Forbid();
        if (comment.AuthorId != userId) return Forbid();

        var boardId = comment.Card.List.BoardId;
        var cardId = comment.CardId;
        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString())
            .SendAsync("CommentDeleted", new { id = commentId, cardId }, ct);
        return NoContent();
    }
}
