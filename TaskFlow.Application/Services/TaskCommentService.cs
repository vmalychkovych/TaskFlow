using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Services
{
    public class TaskCommentService : ITaskCommentService
    {
        private readonly IGenericRepository<TaskComment> _commentRepository;
        private readonly IGenericRepository<TaskItem> _taskRepository;

        public TaskCommentService(
            IGenericRepository<TaskComment> commentRepository,
            IGenericRepository<TaskItem> taskRepository)
        {
            _commentRepository = commentRepository;
            _taskRepository = taskRepository;
        }

        public async Task CreateCommentAsync(CreateTaskCommentDto dto, string userId)
        {
            var taskExists = await _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .AnyAsync(task =>
                    task.Id == dto.TaskItemId &&
                    task.Project.Workspace.OwnerId == userId);

            if (!taskExists)
            {
                throw new NotFoundException("Task not found.");
            }

            var comment = new TaskComment
            {
                Id = Guid.NewGuid(),
                Content = dto.Content,
                TaskItemId = dto.TaskItemId,
                AuthorId = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _commentRepository.AddAsync(comment);
            await _commentRepository.SaveChangesAsync();
        }

        public async Task<List<TaskCommentDto>> GetCommentsByTaskIdAsync(Guid taskId, string userId)
        {
            var taskExists = await _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .AnyAsync(task =>
                    task.Id == taskId &&
                    task.Project.Workspace.OwnerId == userId);

            if (!taskExists)
            {
                throw new NotFoundException("Task not found.");
            }

            var comments = await _commentRepository.Query()
                .Include(comment => comment.Author)
                .Where(comment => comment.TaskItemId == taskId)
                .OrderByDescending(comment => comment.CreatedAt)
                .Select(comment => new TaskCommentDto
                {
                    Id = comment.Id,
                    Content = comment.Content,
                    TaskItemId = comment.TaskItemId,
                    AuthorId = comment.AuthorId,
                    AuthorEmail = comment.Author.Email!,
                    CreatedAt = comment.CreatedAt
                })
                .ToListAsync();

            return comments;
        }
    }
}
