using TaskFlow.Application.Event;

namespace TaskFlow.Application.Interfaces
{
    public interface IDiscordNotificationService
    {
        Task SendTaskCreatedAsync(TaskCreatedEvent taskCreatedEvent);
        Task SendTaskUpdatedAsync(TaskUpdatedEvent taskUpdatedEvent);
    }
}
