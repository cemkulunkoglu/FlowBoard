namespace FlowBoard.Application.Entities;

public class Label
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public Board Board { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Color { get; set; } = null!;

    public ICollection<Card> Cards { get; set; } = new List<Card>();
}
