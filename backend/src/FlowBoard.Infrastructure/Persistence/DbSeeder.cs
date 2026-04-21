using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher, CancellationToken ct = default)
    {
        const string demoEmail = "demo@flowboard.dev";
        const string demoPassword = "demo1234";

        var demoUser = await db.Users.FirstOrDefaultAsync(u => u.Email == demoEmail, ct);
        if (demoUser is null)
        {
            demoUser = new User
            {
                Id = Guid.NewGuid(),
                Email = demoEmail,
                PasswordHash = hasher.Hash(demoPassword),
                DisplayName = "Demo User",
                CreatedAt = DateTime.UtcNow,
            };
            db.Users.Add(demoUser);
            await db.SaveChangesAsync(ct);
        }
        else if (demoUser.PasswordHash == "seed")
        {
            demoUser.PasswordHash = hasher.Hash(demoPassword);
            await db.SaveChangesAsync(ct);
        }

        await EnsureOwnerMembershipsAsync(db, ct);

        if (await db.Boards.AnyAsync(b => b.OwnerId == demoUser.Id, ct)) return;

        var launch = BuildBoard(demoUser.Id, "Ürün Lansmanı", new[]
        {
            ("Yapılacak", new[] { "Landing page copy", "Pazarlama videosu çek", "Launch e-postası taslağı" }),
            ("Devam Ediyor", new[] { "Onboarding akışı", "Fiyatlandırma sayfası" }),
            ("Tamamlandı", new[] { "Marka rehberi", "Analytics kurulumu" }),
        });

        var personal = BuildBoard(demoUser.Id, "Kişisel Görevler", new[]
        {
            ("Bu Hafta", new[] { "Haftalık rapor yaz", "Takım 1-1 toplantısı" }),
            ("Sıradaki", new[] { "Kitap oku: Shape Up", "Bütçe gözden geçir" }),
            ("Bitti", new[] { "Spor planı oluştur" }),
        });

        db.Boards.AddRange(launch, personal);
        db.BoardMembers.Add(new BoardMember
        {
            BoardId = launch.Id,
            UserId = demoUser.Id,
            Role = BoardRole.Owner,
            JoinedAt = DateTime.UtcNow,
        });
        db.BoardMembers.Add(new BoardMember
        {
            BoardId = personal.Id,
            UserId = demoUser.Id,
            Role = BoardRole.Owner,
            JoinedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureOwnerMembershipsAsync(AppDbContext db, CancellationToken ct)
    {
        var boards = await db.Boards.ToListAsync(ct);
        var existing = await db.BoardMembers.ToListAsync(ct);
        var missing = boards
            .Where(b => !existing.Any(m => m.BoardId == b.Id && m.UserId == b.OwnerId))
            .Select(b => new BoardMember
            {
                BoardId = b.Id,
                UserId = b.OwnerId,
                Role = BoardRole.Owner,
                JoinedAt = b.CreatedAt,
            })
            .ToList();
        if (missing.Count > 0)
        {
            db.BoardMembers.AddRange(missing);
            await db.SaveChangesAsync(ct);
        }
    }

    private static Board BuildBoard(Guid ownerId, string title, (string Title, string[] Cards)[] lists)
    {
        var board = new Board
        {
            Id = Guid.NewGuid(),
            Title = title,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow,
        };

        for (var i = 0; i < lists.Length; i++)
        {
            var (listTitle, cardTitles) = lists[i];
            var list = new BoardList
            {
                Id = Guid.NewGuid(),
                Title = listTitle,
                Position = i,
                BoardId = board.Id,
            };

            for (var j = 0; j < cardTitles.Length; j++)
            {
                list.Cards.Add(new Card
                {
                    Id = Guid.NewGuid(),
                    Title = cardTitles[j],
                    Position = j,
                    ListId = list.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                });
            }

            board.Lists.Add(list);
        }

        return board;
    }
}
