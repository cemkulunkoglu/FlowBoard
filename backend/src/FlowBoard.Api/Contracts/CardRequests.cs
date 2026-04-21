namespace FlowBoard.Api.Contracts;

public record CreateCardRequest(Guid ListId, string Title);

public record UpdateCardRequest(string? Title, string? Description, DateTime? DueDate);

public record MoveCardRequest(Guid TargetListId, int NewPosition);

public record CreateListRequest(Guid BoardId, string Title);

public record UpdateListRequest(string Title);

public record CreateLabelRequest(Guid BoardId, string Name, string Color);

public record CreateChecklistItemRequest(string Text);

public record UpdateChecklistItemRequest(string? Text, bool? IsDone);

public record CreateCommentRequest(string Text);
