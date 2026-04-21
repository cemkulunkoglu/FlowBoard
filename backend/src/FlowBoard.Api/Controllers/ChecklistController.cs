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
public class ChecklistController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;

    public ChecklistController(IAppDbContext db, IHubContext<BoardHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpPost("/api/cards/{cardId:guid}/checklist")]
    public async Task<ActionResult<ChecklistItem>> Create(
        Guid cardId,
        CreateChecklistItemRequest req,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Text)) return BadRequest("Metin zorunlu.");

        var card = await _db.Cards
            .Include(c => c.ChecklistItems)
            .Include(c => c.List)
            .FirstOrDefaultAsync(c => c.Id == cardId, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var nextPosition = card.ChecklistItems.Count == 0
            ? 0
            : card.ChecklistItems.Max(i => i.Position) + 1;

        var item = new ChecklistItem
        {
            Id = Guid.NewGuid(),
            CardId = cardId,
            Text = req.Text.Trim(),
            IsDone = false,
            Position = nextPosition,
            CreatedAt = DateTime.UtcNow,
        };

        _db.ChecklistItems.Add(item);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(card.List.BoardId.ToString())
            .SendAsync("ChecklistItemCreated", item, ct);
        return Ok(item);
    }

    [HttpPatch("/api/checklist/{itemId:guid}")]
    public async Task<ActionResult<ChecklistItem>> Update(
        Guid itemId,
        UpdateChecklistItemRequest req,
        CancellationToken ct)
    {
        var item = await _db.ChecklistItems
            .Include(i => i.Card).ThenInclude(c => c.List)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct);
        if (item is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, item.Card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        if (req.Text is not null) item.Text = req.Text.Trim();
        if (req.IsDone is not null) item.IsDone = req.IsDone.Value;

        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(item.Card.List.BoardId.ToString())
            .SendAsync("ChecklistItemUpdated", item, ct);
        return Ok(item);
    }

    [HttpDelete("/api/checklist/{itemId:guid}")]
    public async Task<IActionResult> Delete(Guid itemId, CancellationToken ct)
    {
        var item = await _db.ChecklistItems
            .Include(i => i.Card).ThenInclude(c => c.List)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct);
        if (item is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, item.Card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var boardId = item.Card.List.BoardId;
        var cardId = item.CardId;
        _db.ChecklistItems.Remove(item);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString())
            .SendAsync("ChecklistItemDeleted", new { id = itemId, cardId }, ct);
        return NoContent();
    }
}
