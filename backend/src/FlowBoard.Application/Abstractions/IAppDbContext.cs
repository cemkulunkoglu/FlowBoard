using FlowBoard.Application.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Board> Boards { get; }
    DbSet<BoardList> Lists { get; }
    DbSet<Card> Cards { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
