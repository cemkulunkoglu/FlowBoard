using FlowBoard.Application.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Board> Boards { get; }
    DbSet<BoardList> Lists { get; }
    DbSet<Card> Cards { get; }
    DbSet<Label> Labels { get; }
    DbSet<BoardMember> BoardMembers { get; }
    DbSet<Activity> Activities { get; }
    DbSet<ChecklistItem> ChecklistItems { get; }
    DbSet<Comment> Comments { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<EmailVerificationToken> EmailVerificationTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
