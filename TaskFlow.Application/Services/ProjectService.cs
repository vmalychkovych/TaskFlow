using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IGenericRepository<Project> _projectRepository;
        private readonly IGenericRepository<Workspace> _workspaceRepository;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;

        public ProjectService(
            IGenericRepository<Project> projectRepository,
            IGenericRepository<Workspace> workspaceRepository,
            IMapper mapper,
            UserManager<ApplicationUser> userManager)
        {
            _projectRepository = projectRepository;
            _workspaceRepository = workspaceRepository;
            _mapper = mapper;
            _userManager = userManager;
        }

        public async Task CreateProjectAsync(CreateProjectDto dto, string userId)
        {
            var workspaceExists = await _workspaceRepository.Query()
                .AnyAsync(workspace =>
                    workspace.Id == dto.WorkspaceId &&
                    (workspace.OwnerId == userId ||
                     workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active)));

            if (!workspaceExists)
            {
                throw new NotFoundException("Workspace not found.");
            }

            var project = new Project
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                WorkspaceId = dto.WorkspaceId,
                Members =
                {
                    new ProjectMember
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Role = ProjectRole.ProjectAdmin,
                        Status = ProjectMemberStatus.Active,
                        AddedAt = DateTime.UtcNow
                    }
                }
            };

            await _projectRepository.AddAsync(project);
            await _projectRepository.SaveChangesAsync();
        }

        public async Task<List<ProjectDto>> GetAllProjectsAsync(string userId)
        {
            var projects = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .Where(project =>
                    project.Workspace.OwnerId == userId ||
                    project.Workspace.Members.Any(member =>
                        member.UserId == userId &&
                        member.Status == WorkspaceMemberStatus.Active &&
                        (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                    project.Members.Any(member =>
                        member.UserId == userId &&
                        member.Status == ProjectMemberStatus.Active))
                .ToListAsync();

            return _mapper.Map<List<ProjectDto>>(projects);
        }

        public async Task<ProjectDto?> GetProjectByIdAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    (project.Workspace.OwnerId == userId ||
                     project.Workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active &&
                         (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                     project.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == ProjectMemberStatus.Active)));

            if (project == null)
            {
                return null;
            }

            return _mapper.Map<ProjectDto>(project);
        }

        public async Task<bool> UpdateProjectAsync(Guid id, UpdateProjectDto dto, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .Include(project => project.Tasks)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    CanManageProject(project, userId));

            if (project == null)
            {
                return false;
            }

            project.Name = dto.Name;
            project.Description = dto.Description;

            _projectRepository.Update(project);
            await _projectRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteProjectAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    CanManageProject(project, userId));

            if (project == null)
            {
                return false;
            }

            _projectRepository.Delete(project);
            await _projectRepository.SaveChangesAsync();

            return true;
        }

        public async Task<ProjectDetailsDto?> GetProjectDetailsAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .Include(project => project.Tasks)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    HasProjectAccess(project, userId));

            if (project == null)
            {
                return null;
            }

            return new ProjectDetailsDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                WorkspaceId = project.WorkspaceId,
                Tasks = _mapper.Map<List<TaskDto>>(project.Tasks)
            };
        }

        public async Task<List<ProjectMemberDto>> GetProjectMembersAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    HasProjectAccess(project, userId));

            if (project == null)
            {
                throw new NotFoundException("Project not found.");
            }

            return project.Members
                .Where(member => member.Status == ProjectMemberStatus.Active)
                .Select(member => new ProjectMemberDto
                {
                    UserId = member.UserId,
                    Role = member.Role.ToString(),
                    Status = member.Status.ToString(),
                    AddedAt = member.AddedAt
                })
                .ToList();
        }

        public async Task AddProjectMemberAsync(Guid id, AddProjectMemberDto dto, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    CanManageProject(project, userId));

            if (project == null)
            {
                throw new NotFoundException("Project not found.");
            }

            var targetUser = await _userManager.FindByIdAsync(dto.UserId);
            if (targetUser == null)
            {
                throw new NotFoundException("User not found.");
            }

            var workspaceMembership = project.Workspace.Members.FirstOrDefault(member =>
                member.UserId == dto.UserId &&
                member.Status == WorkspaceMemberStatus.Active);

            if (project.Workspace.OwnerId != dto.UserId && workspaceMembership == null)
            {
                throw new BadRequestException("User must be an active workspace member.");
            }

            var existingMember = project.Members.FirstOrDefault(member => member.UserId == dto.UserId);

            if (existingMember != null && existingMember.Status == ProjectMemberStatus.Active)
            {
                throw new BadRequestException("User is already an active project member.");
            }

            if (existingMember != null)
            {
                existingMember.Role = dto.Role;
                existingMember.Status = ProjectMemberStatus.Active;
                existingMember.AddedAt = DateTime.UtcNow;
            }
            else
            {
                project.Members.Add(new ProjectMember
                {
                    Id = Guid.NewGuid(),
                    ProjectId = project.Id,
                    UserId = dto.UserId,
                    Role = dto.Role,
                    Status = ProjectMemberStatus.Active,
                    AddedAt = DateTime.UtcNow
                });
            }

            _projectRepository.Update(project);
            await _projectRepository.SaveChangesAsync();
        }

        public async Task<bool> RemoveProjectMemberAsync(Guid id, string memberUserId, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    CanManageProject(project, userId));

            if (project == null)
            {
                return false;
            }

            var member = project.Members.FirstOrDefault(existingMember =>
                existingMember.UserId == memberUserId &&
                existingMember.Status == ProjectMemberStatus.Active);

            if (member == null)
            {
                return false;
            }

            if (member.Role == ProjectRole.ProjectAdmin && member.UserId == userId && !IsWorkspaceAdminOrOwner(project.Workspace, userId))
            {
                throw new BadRequestException("Project admin cannot remove themselves.");
            }

            member.Status = ProjectMemberStatus.Removed;
            foreach (var task in project.Tasks.Where(task => task.AssigneeUserId == memberUserId))
            {
                task.AssigneeUserId = null;
            }
            _projectRepository.Update(project);
            await _projectRepository.SaveChangesAsync();

            return true;
        }

        private static bool HasProjectAccess(Project project, string userId)
        {
            return IsWorkspaceAdminOrOwner(project.Workspace, userId) ||
                   project.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == ProjectMemberStatus.Active);
        }

        private static bool CanManageProject(Project project, string userId)
        {
            return IsWorkspaceAdminOrOwner(project.Workspace, userId) ||
                   project.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == ProjectMemberStatus.Active &&
                       member.Role == ProjectRole.ProjectAdmin);
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
