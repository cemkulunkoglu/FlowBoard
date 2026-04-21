using FlowBoard.Api.Auth;
using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/boards/{boardId:guid}/activity")]
public class ActivityController : ControllerBase
{
    private readonly IAppDbContext _db;

    public ActivityController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Activity>>> List(Guid boardId, CancellationToken ct, int take = 50)
    {
        if (!await BoardAccess.IsMemberAsync(_db, boardId, User.GetUserId(), ct)) return Forbid();

        var items = await _db.Activities
            .Where(a => a.BoardId == boardId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(Math.Clamp(take, 1, 200))
            .AsNoTracking()
            .ToListAsync(ct);
        return Ok(items);
    }
}
