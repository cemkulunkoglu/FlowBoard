using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<BoardList> Lists => Set<BoardList>();
    public DbSet<Card> Cards => Set<Card>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<BoardMember> BoardMembers => Set<BoardMember>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.DisplayName).HasMaxLength(128).IsRequired();
        });

        b.Entity<Board>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(128).IsRequired();
            e.HasOne(x => x.Owner).WithMany(x => x.Boards).HasForeignKey(x => x.OwnerId);
        });

        b.Entity<BoardList>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(128).IsRequired();
            e.HasOne(x => x.Board).WithMany(x => x.Lists).HasForeignKey(x => x.BoardId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Card>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(256).IsRequired();
            e.HasOne(x => x.List).WithMany(x => x.Cards).HasForeignKey(x => x.ListId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Labels).WithMany(x => x.Cards).UsingEntity(j => j.ToTable("CardLabels"));
            e.HasMany(x => x.Assignees).WithMany().UsingEntity(j => j.ToTable("CardAssignees"));
        });

        b.Entity<Label>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(64).IsRequired();
            e.Property(x => x.Color).HasMaxLength(16).IsRequired();
            e.HasOne(x => x.Board).WithMany(x => x.Labels).HasForeignKey(x => x.BoardId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<BoardMember>(e =>
        {
            e.HasKey(x => new { x.BoardId, x.UserId });
            e.HasOne(x => x.Board).WithMany(x => x.Members).HasForeignKey(x => x.BoardId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Activity>(e =>
        {
            e.Property(x => x.Action).HasMaxLength(64).IsRequired();
            e.Property(x => x.ActorName).HasMaxLength(128).IsRequired();
            e.HasIndex(x => new { x.BoardId, x.CreatedAt });
        });

        b.Entity<ChecklistItem>(e =>
        {
            e.Property(x => x.Text).HasMaxLength(512).IsRequired();
            e.HasOne(x => x.Card).WithMany(x => x.ChecklistItems)
                .HasForeignKey(x => x.CardId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Comment>(e =>
        {
            e.Property(x => x.Text).HasMaxLength(2000).IsRequired();
            e.Property(x => x.AuthorName).HasMaxLength(128).IsRequired();
            e.HasOne(x => x.Card).WithMany().HasForeignKey(x => x.CardId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.CardId, x.CreatedAt });
        });

        b.Entity<RefreshToken>(e =>
        {
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PasswordResetToken>(e =>
        {
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<EmailVerificationToken>(e =>
        {
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
