using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly IGenericRepository<Workspace> _workspaceRepository;
        private readonly ICacheService _cacheService;
        private readonly UserManager<ApplicationUser> _userManager;

        public WorkspaceService(
            IGenericRepository<Workspace> workspaceRepository,
            ICacheService cacheService,
            UserManager<ApplicationUser> userManager)
        {
            _workspaceRepository = workspaceRepository;
            _cacheService = cacheService;
            _userManager = userManager;
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

        public async Task<List<WorkspaceMemberDto>> GetWorkspaceMembersAsync(Guid id, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .Include(currentWorkspace => currentWorkspace.Members)
                .FirstOrDefaultAsync(currentWorkspace =>
                    currentWorkspace.Id == id &&
                    (currentWorkspace.OwnerId == userId ||
                     currentWorkspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active)));

            if (workspace == null)
            {
                throw new NotFoundException("Workspace not found.");
            }

            return workspace.Members
                .Where(member => member.Status == WorkspaceMemberStatus.Active)
                .Select(member => new WorkspaceMemberDto
                {
                    UserId = member.UserId,
                    Role = member.Role.ToString(),
                    Status = member.Status.ToString(),
                    JoinedAt = member.JoinedAt
                })
                .ToList();
        }

        public async Task AddWorkspaceMemberAsync(Guid id, AddWorkspaceMemberDto dto, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .Include(currentWorkspace => currentWorkspace.Members)
                .FirstOrDefaultAsync(currentWorkspace =>
                    currentWorkspace.Id == id &&
                    IsWorkspaceAdminOrOwner(currentWorkspace, userId));

            if (workspace == null)
            {
                throw new NotFoundException("Workspace not found.");
            }

            var targetUser = await _userManager.FindByIdAsync(dto.UserId);
            if (targetUser == null)
            {
                throw new NotFoundException("User not found.");
            }

            var existingMember = workspace.Members.FirstOrDefault(member => member.UserId == dto.UserId);

            if (existingMember != null && existingMember.Status == WorkspaceMemberStatus.Active)
            {
                throw new BadRequestException("User is already an active workspace member.");
            }

            if (existingMember != null)
            {
                existingMember.Role = dto.Role;
                existingMember.Status = WorkspaceMemberStatus.Active;
                existingMember.JoinedAt = DateTime.UtcNow;
            }
            else
            {
                workspace.Members.Add(new WorkspaceMember
                {
                    Id = Guid.NewGuid(),
                    WorkspaceId = workspace.Id,
                    UserId = dto.UserId,
                    Role = dto.Role,
                    Status = WorkspaceMemberStatus.Active,
                    JoinedAt = DateTime.UtcNow
                });
            }

            _workspaceRepository.Update(workspace);
            await _workspaceRepository.SaveChangesAsync();
            await _cacheService.RemoveAsync($"workspace_details:{userId}:{id}");
        }

        public async Task<bool> RemoveWorkspaceMemberAsync(Guid id, string memberUserId, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .Include(currentWorkspace => currentWorkspace.Members)
                .Include(currentWorkspace => currentWorkspace.Projects)
                .ThenInclude(project => project.Members)
                .Include(currentWorkspace => currentWorkspace.Projects)
                .ThenInclude(project => project.Tasks)
                .FirstOrDefaultAsync(currentWorkspace =>
                    currentWorkspace.Id == id &&
                    IsWorkspaceAdminOrOwner(currentWorkspace, userId));

            if (workspace == null)
            {
                return false;
            }

            var member = workspace.Members.FirstOrDefault(existingMember =>
                existingMember.UserId == memberUserId &&
                existingMember.Status == WorkspaceMemberStatus.Active);

            if (member == null)
            {
                return false;
            }

            if (member.Role == WorkspaceRole.Owner)
            {
                throw new BadRequestException("Workspace owner cannot be removed.");
            }

            member.Status = WorkspaceMemberStatus.Removed;

            foreach (var project in workspace.Projects)
            {
                foreach (var projectMember in project.Members.Where(projectMember =>
                             projectMember.UserId == memberUserId &&
                             projectMember.Status == ProjectMemberStatus.Active))
                {
                    projectMember.Status = ProjectMemberStatus.Removed;
                }

                foreach (var task in project.Tasks.Where(task => task.AssigneeUserId == memberUserId))
                {
                    task.AssigneeUserId = null;
                }
            }

            _workspaceRepository.Update(workspace);
            await _workspaceRepository.SaveChangesAsync();
            await _cacheService.RemoveAsync($"workspace_details:{userId}:{id}");

            return true;
        }

        private static bool IsWorkspaceAdminOrOwner(Workspace workspace, string userId)
        {
            return workspace.OwnerId == userId ||
                   workspace.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == WorkspaceMemberStatus.Active &&
                       (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin));
        }
    }
}
