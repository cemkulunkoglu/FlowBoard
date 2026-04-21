using FlowBoard.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Auth;

public static class BoardAccess
{
    public static Task<bool> IsMemberAsync(IAppDbContext db, Guid boardId, Guid userId, CancellationToken ct) =>
        db.BoardMembers.AnyAsync(m => m.BoardId == boardId && m.UserId == userId, ct);
}
