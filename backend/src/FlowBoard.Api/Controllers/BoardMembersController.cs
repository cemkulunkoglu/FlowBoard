using FlowBoard.Api.Auth;
using FlowBoard.Api.Contracts;
using FlowBoard.Api.Hubs;
using FlowBoard.Api.Services;
using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using IEmailSender = FlowBoard.Application.Abstractions.IEmailSender;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/boards/{boardId:guid}/members")]
public class BoardMembersController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<BoardHub> _hub;
    private readonly ActivityRecorder _activity;
    private readonly IEmailSender _emails;

    public BoardMembersController(
        IAppDbContext db,
        IHubContext<BoardHub> hub,
        ActivityRecorder activity,
        IEmailSender emails)
    {
        _db = db;
        _hub = hub;
        _activity = activity;
        _emails = emails;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BoardMemberDto>>> List(Guid boardId, CancellationToken ct)
    {
        if (!await BoardAccess.IsMemberAsync(_db, boardId, User.GetUserId(), ct)) return Forbid();

        var members = await _db.BoardMembers
            .Where(m => m.BoardId == boardId)
            .Include(m => m.User)
            .OrderBy(m => m.JoinedAt)
            .Select(m => new BoardMemberDto(m.UserId, m.User.Email, m.User.DisplayName, m.Role.ToString(), m.JoinedAt))
            .ToListAsync(ct);
        return Ok(members);
    }

    [HttpPost]
    public async Task<ActionResult<BoardMemberDto>> Invite(Guid boardId, InviteMemberRequest req, CancellationToken ct)
    {
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == boardId, ct);
        if (board is null) return NotFound("Pano bulunamadı.");
        if (board.OwnerId != User.GetUserId()) return Forbid();

        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null) return NotFound("Bu e-postayla kayıtlı kullanıcı yok.");

        var exists = await _db.BoardMembers.AnyAsync(m => m.BoardId == boardId && m.UserId == user.Id, ct);
        if (exists) return Conflict("Kullanıcı zaten üye.");

        var member = new BoardMember
        {
            BoardId = boardId,
            UserId = user.Id,
            Role = BoardRole.Member,
            JoinedAt = DateTime.UtcNow,
        };
        _db.BoardMembers.Add(member);
        await _db.SaveChangesAsync(ct);

        var dto = new BoardMemberDto(user.Id, user.Email, user.DisplayName, member.Role.ToString(), member.JoinedAt);
        await _hub.Clients.Group(boardId.ToString()).SendAsync("MemberAdded", dto, ct);
        await _activity.RecordAsync(User, boardId, "member.added", new { displayName = user.DisplayName }, ct);

        var boardLink = $"http://localhost:5173/boards/{boardId}";
        await _emails.SendAsync(user.Email, $"FlowBoard · '{board.Title}' panosuna eklendin",
            $"Merhaba {user.DisplayName},\n\n'{board.Title}' panosuna üye olarak eklendin.\n\nAçmak için: {boardLink}",
            ct);

        return Ok(dto);
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Remove(Guid boardId, Guid userId, CancellationToken ct)
    {
        var board = await _db.Boards.FirstOrDefaultAsync(b => b.Id == boardId, ct);
        if (board is null) return NotFound();

        var callerId = User.GetUserId();
        if (board.OwnerId != callerId && callerId != userId) return Forbid();
        if (userId == board.OwnerId) return BadRequest("Sahip panodan çıkarılamaz.");

        var member = await _db.BoardMembers.FirstOrDefaultAsync(m => m.BoardId == boardId && m.UserId == userId, ct);
        if (member is null) return NotFound("Üye bulunamadı.");

        var user = await _db.Users.FindAsync(new object?[] { userId }, ct);
        _db.BoardMembers.Remove(member);
        await _db.SaveChangesAsync(ct);

        await _hub.Clients.Group(boardId.ToString()).SendAsync("MemberRemoved", new { boardId, userId }, ct);
        await _activity.RecordAsync(User, boardId, "member.removed",
            new { displayName = user?.DisplayName ?? "Bilinmeyen" }, ct);
        return NoContent();
    }
}
