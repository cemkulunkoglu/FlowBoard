namespace FlowBoard.Application.Entities;

public class Card
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int Position { get; set; }
    public DateTime? DueDate { get; set; }
    public Guid ListId { get; set; }
    public BoardList List { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Label> Labels { get; set; } = new List<Label>();
    public ICollection<User> Assignees { get; set; } = new List<User>();
    public ICollection<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();
}
