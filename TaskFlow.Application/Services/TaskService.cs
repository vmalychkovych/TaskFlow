using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Event;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IGenericRepository<TaskItem> _taskRepository;
        private readonly IGenericRepository<Project> _projectRepository;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IEventBus _eventBus;

        public TaskService(IGenericRepository<TaskItem> taskRepository, IGenericRepository<Project> projectRepository, IMapper mapper, INotificationService notificationService, IEventBus eventBus)
        {
            _taskRepository = taskRepository;
            _projectRepository = projectRepository;
            _mapper = mapper;
            _notificationService = notificationService;
            _eventBus = eventBus;
        }

        public async Task CreateTaskAsync(CreateTaskDto dto, string userId)
        {
            var projectExists = _projectRepository.Query()
                .Include(project => project.Workspace)
                .Any(project =>
                    project.Id == dto.ProjectId &&
                    project.Workspace.OwnerId == userId);

            if (!projectExists)
            {
                throw new NotFoundException("Project not found.");
            }

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
            await _notificationService.SendToUserAsync(userId, $"Task '{task.Title}' created");
            await _eventBus.PublishAsync(new TaskCreatedEvent
            {
                TaskId = task.Id,
                Title = task.Title,
                UserId = userId
            });
        }

        public async Task<List<TaskDto>> GetAllTasksAsync()
        {
            var tasks = await _taskRepository.GetAllAsync();
            return _mapper.Map<List<TaskDto>>(tasks);
        }

        public async Task<TaskDto?> GetTaskByIdAsync(Guid id, string userId)
        {
            var task = await _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .FirstOrDefaultAsync(task =>
                    task.Id == id &&
                    task.Project.Workspace.OwnerId == userId);

            if (task == null)
            {
                return null;
            }

            return _mapper.Map<TaskDto>(task);
        }

        public async Task<bool> UpdateTaskAsync(Guid id, UpdateTaskDto dto, string userId)
        {
            var task = await _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .FirstOrDefaultAsync(task =>
                    task.Id == id &&
                    task.Project.Workspace.OwnerId == userId);

            if (task == null)
            {
                return false;
            }

            task.Title = dto.Title;
            task.Description = dto.Description;
            task.Priority = dto.Priority;
            task.Status = dto.Status;

            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteTaskAsync(Guid id, string userId)
        {
            var task = await _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .FirstOrDefaultAsync(task =>
                    task.Id == id &&
                    task.Project.Workspace.OwnerId == userId);

            if (task == null)
            {
                return false;
            }

            _taskRepository.Delete(task);
            await _taskRepository.SaveChangesAsync();

            return true;
        }

        public async Task<PagedResult<TaskDto>> GetTasksAsync(TaskQuery query, string userId)
        {
            var tasksQuery = _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .Where(task => task.Project.Workspace.OwnerId == userId);

            if (query.Priority.HasValue)
            {
                tasksQuery = tasksQuery.Where(task => task.Priority == query.Priority.Value);
            }

            if (query.Status.HasValue)
            {
                tasksQuery = tasksQuery.Where(task => task.Status == query.Status.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.ToLower();

                tasksQuery = tasksQuery.Where(task =>
                    task.Title.ToLower().Contains(search) ||
                    task.Description.ToLower().Contains(search));
            }

            tasksQuery = query.SortBy.ToLower() switch
            {
                "title" => query.SortOrder.ToLower() == "asc"
                    ? tasksQuery.OrderBy(task => task.Title)
                    : tasksQuery.OrderByDescending(task => task.Title),

                "priority" => query.SortOrder.ToLower() == "asc"
                    ? tasksQuery.OrderBy(task => task.Priority)
                    : tasksQuery.OrderByDescending(task => task.Priority),

                "status" => query.SortOrder.ToLower() == "asc"
                    ? tasksQuery.OrderBy(task => task.Status)
                    : tasksQuery.OrderByDescending(task => task.Status),

                _ => query.SortOrder.ToLower() == "asc"
                    ? tasksQuery.OrderBy(task => task.CreatedAt)
                    : tasksQuery.OrderByDescending(task => task.CreatedAt)
            };

            var totalCount = await tasksQuery.CountAsync();

            var tasks = await tasksQuery
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<TaskDto>
            {
                Items = _mapper.Map<List<TaskDto>>(tasks),
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize
            };
        }
    }
}
