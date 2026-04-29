
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface ITaskCommentService
    {
        Task CreateCommentAsync(CreateTaskCommentDto dto, string userId);
        Task<List<TaskCommentDto>> GetCommentsByTaskIdAsync(Guid taskId, string userId);
    }
}
