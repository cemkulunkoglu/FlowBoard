namespace FlowBoard.Application.Entities;

public class Activity
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public Guid ActorId { get; set; }
    public string ActorName { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string Payload { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
}
