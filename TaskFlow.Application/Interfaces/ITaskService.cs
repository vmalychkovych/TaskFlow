
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface ITaskService
    {
        Task CreateTaskAsync(CreateTaskDto dto);
        Task<List<TaskDto>> GetAllTasksAsync();
        Task<TaskDto?> GetTaskByIdAsync(Guid id);
        Task<bool> UpdateTaskAsync(Guid id, UpdateTaskDto dto);
    }
}
