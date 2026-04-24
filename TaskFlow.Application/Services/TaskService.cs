using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
    }
}
