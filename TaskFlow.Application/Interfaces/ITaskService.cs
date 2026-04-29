
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface ITaskService
    {
        Task CreateTaskAsync(CreateTaskDto dto, string userId);
        Task<PagedResult<TaskDto>> GetTasksAsync(TaskQuery query, string userId);
        Task<TaskDto?> GetTaskByIdAsync(Guid id, string userId);
        Task<bool> UpdateTaskAsync(Guid id, UpdateTaskDto dto, string userId);
        Task<bool> DeleteTaskAsync(Guid id, string userId);
    }
}
