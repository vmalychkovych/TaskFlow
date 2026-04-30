using Microsoft.AspNetCore.SignalR;
using TaskFlow.Application.Interfaces;
using TaskFlow.WebAPI.Hubs;

namespace TaskFlow.WebAPI.Services
{
    public class SignalRNotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public SignalRNotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendToUserAsync(string userId, string message)
        {
            await _hubContext.Clients.User(userId)
                .SendAsync("ReceiveNotification", message);
        }
    }
}
