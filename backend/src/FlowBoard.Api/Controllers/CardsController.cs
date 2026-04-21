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
public class CardsController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;
    private readonly ActivityRecorder _activity;

    public CardsController(IAppDbContext db, IHubContext<BoardHub> hub, ActivityRecorder activity)
    {
        _db = db;
        _hub = hub;
        _activity = activity;
    }

    [HttpPost]
    public async Task<ActionResult<Card>> Create(CreateCardRequest req, CancellationToken ct)
    {
        var list = await _db.Lists
            .Include(l => l.Cards)
            .FirstOrDefaultAsync(l => l.Id == req.ListId, ct);
        if (list is null) return NotFound("Liste bulunamadı.");
        if (!await BoardAccess.IsMemberAsync(_db, list.BoardId, User.GetUserId(), ct)) return Forbid();

        var nextPosition = list.Cards.Count == 0 ? 0 : list.Cards.Max(c => c.Position) + 1;
        var card = new Card
        {
            Id = Guid.NewGuid(),
            Title = req.Title,
            Position = nextPosition,
            ListId = req.ListId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Cards.Add(card);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(list.BoardId.ToString()).SendAsync("CardCreated", card, ct);
        await _activity.RecordAsync(User, list.BoardId, "card.created",
            new { cardTitle = card.Title, listTitle = list.Title }, ct);
        return Ok(card);
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<Card>> Update(Guid id, UpdateCardRequest req, CancellationToken ct)
    {
        var card = await _db.Cards.Include(c => c.List).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        if (req.Title is not null) card.Title = req.Title;
        if (req.Description is not null) card.Description = req.Description;
        if (req.DueDate is not null) card.DueDate = req.DueDate;
        card.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(card.List.BoardId.ToString()).SendAsync("CardUpdated", card, ct);
        return Ok(card);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var card = await _db.Cards.Include(c => c.List).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var boardId = card.List.BoardId;
        var cardTitle = card.Title;
        _db.Cards.Remove(card);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString()).SendAsync("CardDeleted", new { id, listId = card.ListId }, ct);
        await _activity.RecordAsync(User, boardId, "card.deleted", new { cardTitle }, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/labels/{labelId:guid}")]
    public async Task<IActionResult> AttachLabel(Guid id, Guid labelId, CancellationToken ct)
    {
        var card = await _db.Cards
            .Include(c => c.Labels)
            .Include(c => c.List)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var label = await _db.Labels.FirstOrDefaultAsync(l => l.Id == labelId, ct);
        if (label is null) return NotFound("Etiket bulunamadı.");
        if (label.BoardId != card.List.BoardId) return BadRequest("Etiket farklı panoya ait.");

        if (!card.Labels.Any(l => l.Id == labelId))
        {
            card.Labels.Add(label);
            await _db.SaveChangesAsync(ct);
        }

        await _hub.Clients.Group(card.List.BoardId.ToString()).SendAsync("CardLabelsChanged",
            new { cardId = id, labelIds = card.Labels.Select(l => l.Id) }, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}/labels/{labelId:guid}")]
    public async Task<IActionResult> DetachLabel(Guid id, Guid labelId, CancellationToken ct)
    {
        var card = await _db.Cards
            .Include(c => c.Labels)
            .Include(c => c.List)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var label = card.Labels.FirstOrDefault(l => l.Id == labelId);
        if (label is not null)
        {
            card.Labels.Remove(label);
            await _db.SaveChangesAsync(ct);
        }

        await _hub.Clients.Group(card.List.BoardId.ToString()).SendAsync("CardLabelsChanged",
            new { cardId = id, labelIds = card.Labels.Select(l => l.Id) }, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/assignees/{userId:guid}")]
    public async Task<IActionResult> AttachAssignee(Guid id, Guid userId, CancellationToken ct)
    {
        var card = await _db.Cards
            .Include(c => c.Assignees)
            .Include(c => c.List)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var targetIsMember = await _db.BoardMembers.AnyAsync(m => m.BoardId == card.List.BoardId && m.UserId == userId, ct);
        if (!targetIsMember) return BadRequest("Kullanıcı bu panonun üyesi değil.");

        if (!card.Assignees.Any(u => u.Id == userId))
        {
            var user = await _db.Users.FindAsync(new object?[] { userId }, ct);
            if (user is null) return NotFound("Kullanıcı bulunamadı.");
            card.Assignees.Add(user);
            await _db.SaveChangesAsync(ct);
        }

        await _hub.Clients.Group(card.List.BoardId.ToString()).SendAsync("CardAssigneesChanged",
            new { cardId = id, assigneeIds = card.Assignees.Select(u => u.Id) }, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}/assignees/{userId:guid}")]
    public async Task<IActionResult> DetachAssignee(Guid id, Guid userId, CancellationToken ct)
    {
        var card = await _db.Cards
            .Include(c => c.Assignees)
            .Include(c => c.List)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var assignee = card.Assignees.FirstOrDefault(u => u.Id == userId);
        if (assignee is not null)
        {
            card.Assignees.Remove(assignee);
            await _db.SaveChangesAsync(ct);
        }

        await _hub.Clients.Group(card.List.BoardId.ToString()).SendAsync("CardAssigneesChanged",
            new { cardId = id, assigneeIds = card.Assignees.Select(u => u.Id) }, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/move")]
    public async Task<IActionResult> Move(Guid id, MoveCardRequest req, CancellationToken ct)
    {
        var card = await _db.Cards.Include(c => c.List).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (card is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, card.List.BoardId, User.GetUserId(), ct)) return Forbid();

        var targetList = await _db.Lists.FirstOrDefaultAsync(l => l.Id == req.TargetListId, ct);
        if (targetList is null) return NotFound("Hedef liste bulunamadı.");
        if (targetList.BoardId != card.List.BoardId) return BadRequest("Kartlar panolar arasında taşınamaz.");

        var sourceListId = card.ListId;
        var boardId = card.List.BoardId;

        if (sourceListId == req.TargetListId)
        {
            var siblings = await _db.Cards
                .Where(c => c.ListId == sourceListId && c.Id != id)
                .OrderBy(c => c.Position)
                .ToListAsync(ct);

            siblings.Insert(Math.Clamp(req.NewPosition, 0, siblings.Count), card);
            for (var i = 0; i < siblings.Count; i++) siblings[i].Position = i;
        }
        else
        {
            var sourceSiblings = await _db.Cards
                .Where(c => c.ListId == sourceListId && c.Id != id)
                .OrderBy(c => c.Position)
                .ToListAsync(ct);
            for (var i = 0; i < sourceSiblings.Count; i++) sourceSiblings[i].Position = i;

            var targetSiblings = await _db.Cards
                .Where(c => c.ListId == req.TargetListId)
                .OrderBy(c => c.Position)
                .ToListAsync(ct);
            targetSiblings.Insert(Math.Clamp(req.NewPosition, 0, targetSiblings.Count), card);
            for (var i = 0; i < targetSiblings.Count; i++) targetSiblings[i].Position = i;

            card.ListId = req.TargetListId;
        }

        card.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString()).SendAsync("CardMoved", new
        {
            cardId = id,
            sourceListId,
            targetListId = req.TargetListId,
            newPosition = card.Position,
        }, ct);

        if (sourceListId != req.TargetListId)
        {
            await _activity.RecordAsync(User, boardId, "card.moved", new
            {
                cardTitle = card.Title,
                fromList = card.List.Title,
                toList = targetList.Title,
            }, ct);
        }

        return NoContent();
    }
}
