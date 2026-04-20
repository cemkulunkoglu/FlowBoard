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
        });
    }
}
