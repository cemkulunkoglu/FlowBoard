using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly IAppDbContext _db;

    public BoardsController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Board>>> List(CancellationToken ct) =>
        Ok(await _db.Boards.AsNoTracking().ToListAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Board>> Get(Guid id, CancellationToken ct)
    {
        var board = await _db.Boards
            .Include(b => b.Lists).ThenInclude(l => l.Cards)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, ct);
        return board is null ? NotFound() : Ok(board);
    }
}
