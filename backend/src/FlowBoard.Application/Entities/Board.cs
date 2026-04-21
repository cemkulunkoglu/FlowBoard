namespace FlowBoard.Application.Entities;

public class Board
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    public ICollection<BoardList> Lists { get; set; } = new List<BoardList>();
    public ICollection<Label> Labels { get; set; } = new List<Label>();
    public ICollection<BoardMember> Members { get; set; } = new List<BoardMember>();
}
