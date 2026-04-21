namespace FlowBoard.Application.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public Guid CardId { get; set; }
    public Card Card { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = null!;
    public string Text { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
