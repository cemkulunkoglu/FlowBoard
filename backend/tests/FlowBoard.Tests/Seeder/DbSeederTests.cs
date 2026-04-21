using FlowBoard.Application.Entities;
using FlowBoard.Infrastructure.Persistence;
using FlowBoard.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Tests.Seeder;

public class DbSeederTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    [Fact]
    public async Task SeedAsync_Creates_DemoUserAndBoards()
    {
        await using var db = CreateContext();
        var hasher = new BCryptPasswordHasher();

        await DbSeeder.SeedAsync(db, hasher);

        var user = await db.Users.SingleAsync();
        Assert.Equal("demo@flowboard.dev", user.Email);
        Assert.True(hasher.Verify("demo1234", user.PasswordHash));

        var boards = await db.Boards.ToListAsync();
        Assert.Equal(2, boards.Count);
        Assert.All(boards, b => Assert.Equal(user.Id, b.OwnerId));
    }

    [Fact]
    public async Task SeedAsync_Adds_OwnerMembership_ForEachBoard()
    {
        await using var db = CreateContext();
        var hasher = new BCryptPasswordHasher();

        await DbSeeder.SeedAsync(db, hasher);

        var memberships = await db.BoardMembers.ToListAsync();
        var boards = await db.Boards.ToListAsync();
        Assert.Equal(boards.Count, memberships.Count);
        Assert.All(memberships, m => Assert.Equal(BoardRole.Owner, m.Role));
    }

    [Fact]
    public async Task SeedAsync_IsIdempotent_ForDemoUser()
    {
        await using var db = CreateContext();
        var hasher = new BCryptPasswordHasher();

        await DbSeeder.SeedAsync(db, hasher);
        await DbSeeder.SeedAsync(db, hasher);

        Assert.Equal(1, await db.Users.CountAsync());
        Assert.Equal(2, await db.Boards.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_UpgradesLegacySeedHash()
    {
        await using var db = CreateContext();
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "demo@flowboard.dev",
            PasswordHash = "seed",
            DisplayName = "Demo User",
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var hasher = new BCryptPasswordHasher();
        await DbSeeder.SeedAsync(db, hasher);

        var user = await db.Users.SingleAsync();
        Assert.NotEqual("seed", user.PasswordHash);
        Assert.True(hasher.Verify("demo1234", user.PasswordHash));
    }
}
