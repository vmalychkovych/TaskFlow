using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IGenericRepository<TaskItem> _taskRepository;
        private readonly IMapper _mapper;

        public TaskService(IGenericRepository<TaskItem> taskRepository,IMapper mapper)
        {
            _taskRepository = taskRepository;
            _mapper = mapper;
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
            return _mapper.Map<List<TaskDto>>(tasks);
        }

        public async Task<TaskDto?> GetTaskByIdAsync(Guid id)
        {
            var task = await _taskRepository.GetByIdAsync(id);

            if (task == null)
            {
                throw new NotFoundException("Task not found.");
            }

            return _mapper.Map<TaskDto>(task);
        }

        public async Task<bool> UpdateTaskAsync(Guid id, UpdateTaskDto dto)
        {
            var task = await _taskRepository.GetByIdAsync(id);

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

        public async Task<bool> DeleteTaskAsync(Guid id)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
            {
                return false;
            }
            _taskRepository.Delete(task);
            await _taskRepository.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResult<TaskDto>> GetTasksAsync(TaskQuery query)
        {
            var tasksQuery = _taskRepository.Query();

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
                tasksQuery = tasksQuery.Where(task =>
                    task.Title.ToLower().Contains(query.Search.ToLower()) ||
                    task.Description.ToLower().Contains(query.Search.ToLower()));
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

            var taskDtos = _mapper.Map<List<TaskDto>>(tasks);

            return new PagedResult<TaskDto>
            {
                Items =taskDtos
            };
        }
    }
}
