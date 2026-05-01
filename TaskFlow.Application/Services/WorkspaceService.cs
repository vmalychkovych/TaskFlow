using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly IGenericRepository<Workspace> _workspaceRepository;
        private readonly ICacheService _cacheService;

        public WorkspaceService(IGenericRepository<Workspace> workspaceRepository, ICacheService cacheService)
        {
            _workspaceRepository = workspaceRepository;
            _cacheService = cacheService;
        }

        public async Task CreateWorkspaceAsync(CreateWorkspaceDto dto, string userId)
        {
            var workspace = new Workspace
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                OwnerId = userId,
                Members =
                {
                    new WorkspaceMember
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Role = WorkspaceRole.Owner,
                        Status = WorkspaceMemberStatus.Active,
                        JoinedAt = DateTime.UtcNow
                    }
                }
            };

            await _workspaceRepository.AddAsync(workspace);
            await _workspaceRepository.SaveChangesAsync();
        }

        public async Task<List<WorkspaceDto>> GetAllWorkspacesAsync(string userId)
        {
            var workspaces = await _workspaceRepository.Query()
                .Where(workspace =>
                    workspace.OwnerId == userId ||
                    workspace.Members.Any(member =>
                        member.UserId == userId &&
                        member.Status == WorkspaceMemberStatus.Active))
                .ToListAsync();

            return workspaces.Select(workspace => new WorkspaceDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Description = workspace.Description
            }).ToList();
        }

        public async Task<WorkspaceDto?> GetWorkspaceByIdAsync(Guid id, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .FirstOrDefaultAsync(workspace =>
                    workspace.Id == id &&
                    (workspace.OwnerId == userId ||
                     workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active)));

            if (workspace == null)
            {
                return null;
            }

            return new WorkspaceDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Description = workspace.Description
            };
        }

        public async Task<bool> UpdateWorkspaceAsync(Guid id, UpdateWorkspaceDto dto, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .FirstOrDefaultAsync(workspace =>
                    workspace.Id == id &&
                    (workspace.OwnerId == userId ||
                     workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active &&
                         (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin))));

            if (workspace == null)
            {
                return false;
            }

            workspace.Name = dto.Name;
            workspace.Description = dto.Description;

            _workspaceRepository.Update(workspace);
            await _workspaceRepository.SaveChangesAsync();
            await _cacheService.RemoveAsync($"workspace_details:{userId}:{id}");

            return true;
        }

        public async Task<bool> DeleteWorkspaceAsync(Guid id, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .FirstOrDefaultAsync(workspace =>
                    workspace.Id == id &&
                    (workspace.OwnerId == userId ||
                     workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active &&
                         member.Role == WorkspaceRole.Owner)));

            if (workspace == null)
            {
                return false;
            }

            _workspaceRepository.Delete(workspace);
            await _workspaceRepository.SaveChangesAsync();
            await _cacheService.RemoveAsync($"workspace_details:{userId}:{id}");

            return true;
        }

        public async Task<WorkspaceDetailsDto?> GetWorkspaceDetailsAsync(Guid id, string userId)
        {
            var cacheKey = $"workspace_details:{userId}:{id}";

            var cachedWorkspace = await _cacheService.GetAsync<WorkspaceDetailsDto>(cacheKey);

            if (cachedWorkspace != null)
            {
                return cachedWorkspace;
            }

            var workspace = await _workspaceRepository.Query()
                .Include(workspace => workspace.Projects)
                .ThenInclude(project => project.Tasks)
                .FirstOrDefaultAsync(workspace =>
                    workspace.Id == id &&
                    (workspace.OwnerId == userId ||
                     workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active)));

            if (workspace == null)
            {
                return null;
            }

            var result = new WorkspaceDetailsDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Description = workspace.Description,
                Projects = workspace.Projects.Select(project => new ProjectDetailsDto
                {
                    Id = project.Id,
                    Name = project.Name,
                    Description = project.Description,
                    WorkspaceId = project.WorkspaceId,
                    Tasks = project.Tasks.Select(task => new TaskDto
                    {
                        Id = task.Id,
                        Title = task.Title,
                        Description = task.Description,
                        Priority = task.Priority.ToString(),
                        Status = task.Status.ToString(),
                        CreatedAt = task.CreatedAt
                    }).ToList()
                }).ToList()
            };

            await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));

            return result;
        }
    }
}
