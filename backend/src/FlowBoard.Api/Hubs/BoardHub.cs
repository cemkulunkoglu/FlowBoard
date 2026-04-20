using Microsoft.AspNetCore.SignalR;

namespace FlowBoard.Api.Hubs;

public class BoardHub : Hub
{
    public Task JoinBoard(Guid boardId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, boardId.ToString());

    public Task LeaveBoard(Guid boardId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, boardId.ToString());
}
