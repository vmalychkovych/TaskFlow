namespace TaskFlow.Application.Interfaces
{
    public interface INotificationService
    {
        Task SendToUserAsync(string userId, string message);
    }
}
