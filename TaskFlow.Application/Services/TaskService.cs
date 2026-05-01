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

        public TaskService(
            IGenericRepository<TaskItem> taskRepository,
            IGenericRepository<Project> projectRepository,
            IMapper mapper,
            INotificationService notificationService,
            IEventBus eventBus)
        {
            _taskRepository = taskRepository;
            _projectRepository = projectRepository;
            _mapper = mapper;
            _notificationService = notificationService;
            _eventBus = eventBus;
        }

        public async Task CreateTaskAsync(CreateTaskDto dto, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project => project.Id == dto.ProjectId);

            if (project == null || !HasProjectAccess(project, userId))
            {
                throw new NotFoundException("Project not found.");
            }

            ValidateAssignee(project, dto.AssigneeUserId);

            var task = new TaskItem
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                ProjectId = dto.ProjectId,
                CreatedAt = DateTime.UtcNow,
                Priority = TaskPriority.Medium,
                Status = TaskItemStatus.ToDo,
                AssigneeUserId = dto.AssigneeUserId
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
                .ThenInclude(workspace => workspace.Members)
                .Include(task => task.Project.Members)
                .FirstOrDefaultAsync(task => task.Id == id);

            if (task == null || !HasProjectAccess(task.Project, userId))
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
                .ThenInclude(workspace => workspace.Members)
                .Include(task => task.Project.Members)
                .FirstOrDefaultAsync(task => task.Id == id);

            if (task == null || !HasProjectAccess(task.Project, userId))
            {
                return false;
            }

            ValidateAssignee(task.Project, dto.AssigneeUserId);

            task.Title = dto.Title;
            task.Description = dto.Description;
            task.Priority = dto.Priority;
            task.Status = dto.Status;
            task.AssigneeUserId = dto.AssigneeUserId;

            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteTaskAsync(Guid id, string userId)
        {
            var task = await _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(task => task.Project.Members)
                .FirstOrDefaultAsync(task => task.Id == id);

            if (task == null || !HasProjectAccess(task.Project, userId))
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
                .Include(task => task.Project.Members)
                .Where(task =>
                    task.Project.Workspace.OwnerId == userId ||
                    task.Project.Workspace.Members.Any(member =>
                        member.UserId == userId &&
                        member.Status == WorkspaceMemberStatus.Active &&
                        (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                    task.Project.Members.Any(member =>
                        member.UserId == userId &&
                        member.Status == ProjectMemberStatus.Active));

            if (query.Priority.HasValue)
            {
                tasksQuery = tasksQuery.Where(task => task.Priority == query.Priority.Value);
            }

            if (query.Status.HasValue)
            {
                tasksQuery = tasksQuery.Where(task => task.Status == query.Status.Value);
            }

            if (query.AssignedToMe)
            {
                tasksQuery = tasksQuery.Where(task => task.AssigneeUserId == userId);
            }
            else if (!string.IsNullOrWhiteSpace(query.AssigneeUserId))
            {
                tasksQuery = tasksQuery.Where(task => task.AssigneeUserId == query.AssigneeUserId);
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

        private static bool HasProjectAccess(Project project, string userId)
        {
            return project.Workspace.OwnerId == userId ||
                   project.Workspace.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == WorkspaceMemberStatus.Active &&
                       (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                   project.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == ProjectMemberStatus.Active);
        }

        private static void ValidateAssignee(Project project, string? assigneeUserId)
        {
            if (string.IsNullOrWhiteSpace(assigneeUserId))
            {
                return;
            }

            var isProjectMember = project.Members.Any(member =>
                member.UserId == assigneeUserId &&
                member.Status == ProjectMemberStatus.Active);

            if (!isProjectMember)
            {
                throw new BadRequestException("Assignee must be an active project member.");
            }
        }
    }
}
