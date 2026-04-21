namespace FlowBoard.Application.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }

    public ICollection<Board> Boards { get; set; } = new List<Board>();
}
