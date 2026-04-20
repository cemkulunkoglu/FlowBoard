namespace FlowBoard.Application.Entities;

public class BoardList
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public int Position { get; set; }
    public Guid BoardId { get; set; }
    public Board Board { get; set; } = null!;

    public ICollection<Card> Cards { get; set; } = new List<Card>();
}
