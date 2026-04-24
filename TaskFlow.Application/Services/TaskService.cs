using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IGenericRepository<TaskItem> _taskRepository;

        public TaskService(IGenericRepository<TaskItem> taskRepository)
        {
            _taskRepository = taskRepository;
        }

        public async Task CreateTaskAsync(CreateTaskDto dto)
        {
            var task = new TaskItem
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                ProjectId = dto.ProjectId,
                CreatedAt = DateTime.UtcNow,
                Priority = TaskPriority.Medium,
                Status = TaskItemStatus.ToDo
            };

            await _taskRepository.AddAsync(task);
            await _taskRepository.SaveChangesAsync();
        }

        public async Task<List<TaskDto>> GetAllTasksAsync()
        {
            var tasks = await _taskRepository.GetAllAsync();

            var result = tasks
                .Select(task => new TaskDto
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    CreatedAt = task.CreatedAt,
                    Priority = task.Priority.ToString(),
                    Status = task.Status.ToString()
                })
                .ToList();

            return result;
        }

        public async Task<TaskDto?> GetTaskByIdAsync(Guid id)
        {
            var task = await _taskRepository.GetByIdAsync(id);

            if (task == null)
            {
                return null;
            }

            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                CreatedAt = task.CreatedAt,
                Priority = task.Priority.ToString(),
                Status = task.Status.ToString()
            };
        }
    }
}
