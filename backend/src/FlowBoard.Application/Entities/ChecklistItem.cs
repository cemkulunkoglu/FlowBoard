namespace FlowBoard.Application.Entities;

public class ChecklistItem
{
    public Guid Id { get; set; }
    public Guid CardId { get; set; }
    public Card Card { get; set; } = null!;
    public string Text { get; set; } = null!;
    public bool IsDone { get; set; }
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }
}
