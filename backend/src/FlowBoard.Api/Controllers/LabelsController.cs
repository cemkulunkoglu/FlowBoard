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
[Route("api/[controller]")]
public class LabelsController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;

    public LabelsController(IAppDbContext db, IHubContext<BoardHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpPost]
    public async Task<ActionResult<Label>> Create(CreateLabelRequest req, CancellationToken ct)
    {
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == req.BoardId, ct);
        if (board is null) return NotFound("Pano bulunamadı.");
        if (!await BoardAccess.IsMemberAsync(_db, board.Id, User.GetUserId(), ct)) return Forbid();
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("İsim zorunlu.");

        var label = new Label
        {
            Id = Guid.NewGuid(),
            BoardId = req.BoardId,
            Name = req.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(req.Color) ? "#64748b" : req.Color,
        };

        _db.Labels.Add(label);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(req.BoardId.ToString()).SendAsync("LabelCreated", label, ct);
        return Ok(label);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var label = await _db.Labels.FirstOrDefaultAsync(l => l.Id == id, ct);
        if (label is null) return NotFound();
        if (!await BoardAccess.IsMemberAsync(_db, label.BoardId, User.GetUserId(), ct)) return Forbid();

        var boardId = label.BoardId;
        _db.Labels.Remove(label);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString()).SendAsync("LabelDeleted", new { id, boardId }, ct);
        return NoContent();
    }
}
